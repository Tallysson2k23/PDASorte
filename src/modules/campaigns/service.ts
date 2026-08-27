import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { AdminActor } from "@/lib/auth/session";
import { campaignInputSchema, campaignStatusSchema, type CampaignDTO, type CampaignInput } from "./schema";
import { canDrawCampaign, selectWinningReservation } from "./draw";

function iso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : null;
}

function legacyInput(data: Record<string, unknown>): CampaignInput {
  const legacyStatus = typeof data.status === "string" ? data.status : "draft";
  const status = legacyStatus === "demo_active" ? "published" : legacyStatus === "archived" ? "archived" : legacyStatus === "paused" || legacyStatus === "blocked" || legacyStatus === "drawn" ? "closed" : "draft";
  return campaignInputSchema.parse({
    title: data.title,
    description: data.description,
    imageUrl: data.imageUrl ?? "",
    prizeDescription: "Prêmio do sorteio interno",
    numberStart: data.numberStart,
    numberEnd: data.numberEnd,
    drawAt: iso(data.startsAt) ?? new Date().toISOString(),
    timeZone: "America/Recife",
    rules: data.regulation ?? "Sorteio recreativo e gratuito, destinado exclusivamente aos integrantes do grupo.",
    status,
  });
}

function currentInput(data: Record<string, unknown>): CampaignInput {
  const editableData = data.status === "drawn" ? { ...data, status: "closed" } : data;
  const parsed = campaignInputSchema.safeParse(editableData);
  return parsed.success ? parsed.data : legacyInput(data);
}

function toDTO(id: string, data: Record<string, unknown>): CampaignDTO {
  const input = currentInput(data);
  const storedStatus = campaignStatusSchema.safeParse(data.status);
  const status = storedStatus.success && storedStatus.data === "drawn" ? "drawn" : input.status;
  return {
    id,
    ...input,
    status,
    version: typeof data.version === "number" ? data.version : 1,
    reservedCount: typeof data.reservedCount === "number" ? data.reservedCount : 0,
    winningNumber: typeof data.winningNumber === "number" ? data.winningNumber : null,
    winnerName: typeof data.winnerName === "string" ? data.winnerName : null,
    winnerContact: typeof data.winnerContact === "string" ? data.winnerContact : null,
    drawnAt: iso(data.drawnAt),
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
  };
}

export async function listCampaigns(): Promise<CampaignDTO[]> {
  const snapshot = await adminDb().collection("campaigns").orderBy("createdAt", "desc").limit(100).get();
  return snapshot.docs.map((document) => toDTO(document.id, document.data()));
}

export async function listPublicCampaigns(): Promise<CampaignDTO[]> {
  const campaigns = await listCampaigns();
  return campaigns.filter((campaign) => campaign.status === "published" || campaign.status === "closed" || campaign.status === "drawn");
}

export async function getPublicCampaign(id: string): Promise<CampaignDTO | null> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) return null;
  const snapshot = await adminDb().collection("campaigns").doc(id).get();
  if (!snapshot.exists) return null;
  const campaign = toDTO(snapshot.id, snapshot.data()!);
  return campaign.status === "published" || campaign.status === "closed" || campaign.status === "drawn" ? campaign : null;
}

export async function createCampaign(rawInput: unknown, actor: AdminActor): Promise<CampaignDTO> {
  const input = campaignInputSchema.parse(rawInput);
  const db = adminDb();
  const campaignRef = db.collection("campaigns").doc();
  const now = FieldValue.serverTimestamp();
  const record = { ...input, version: 1, reservedCount: 0, winningNumber: null, winnerName: null, winnerContact: null, drawnAt: null, createdAt: now, updatedAt: now, createdBy: actor.uid };
  await db.runTransaction(async (transaction) => {
    transaction.create(campaignRef, record);
    transaction.create(db.collection("campaignVersions").doc(), { campaignId: campaignRef.id, version: 1, snapshot: input, createdAt: now, createdBy: actor.uid, reason: "Criação" });
    transaction.create(db.collection("auditLogs").doc(), { actorId: actor.uid, action: "campaign.created", entity: `campaigns/${campaignRef.id}`, after: input, createdAt: now });
  });
  const created = await campaignRef.get();
  return toDTO(created.id, created.data()!);
}

export async function updateCampaign(id: string, rawInput: unknown, actor: AdminActor): Promise<CampaignDTO> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error("INVALID_ID");
  const input = campaignInputSchema.parse(rawInput);
  const db = adminDb();
  const campaignRef = db.collection("campaigns").doc(id);
  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(campaignRef);
    if (!existing.exists) throw new Error("NOT_FOUND");
    const before = existing.data()!;
    if (before.status === "drawn" || typeof before.winningNumber === "number") throw new Error("DRAW_ALREADY_COMPLETED");
    const beforeInput = currentInput(before);
    if ((typeof before.reservedCount === "number" ? before.reservedCount : 0) > 0 && (input.numberStart !== beforeInput.numberStart || input.numberEnd !== beforeInput.numberEnd)) throw new Error("RESERVATIONS_LOCK_RANGE");
    const version = (typeof before.version === "number" ? before.version : 1) + 1;
    const now = FieldValue.serverTimestamp();
    transaction.set(campaignRef, { ...input, version, reservedCount: typeof before.reservedCount === "number" ? before.reservedCount : 0, winningNumber: null, winnerName: null, winnerContact: null, drawnAt: null, createdAt: before.createdAt ?? now, createdBy: before.createdBy ?? actor.uid, updatedAt: now, updatedBy: actor.uid }, { merge: false });
    transaction.create(db.collection("campaignVersions").doc(), { campaignId: id, version, snapshot: input, createdAt: now, createdBy: actor.uid, reason: "Edição administrativa" });
    transaction.create(db.collection("auditLogs").doc(), { actorId: actor.uid, action: "campaign.updated", entity: `campaigns/${id}`, before: beforeInput, after: input, createdAt: now });
  });
  const updated = await campaignRef.get();
  return toDTO(updated.id, updated.data()!);
}

export async function drawCampaign(id: string, actor: AdminActor): Promise<CampaignDTO> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new Error("INVALID_ID");
  const db = adminDb();
  const campaignRef = db.collection("campaigns").doc(id);
  await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(campaignRef);
    if (!existing.exists) throw new Error("NOT_FOUND");
    const before = toDTO(existing.id, existing.data()!);
    if (before.status === "drawn" || before.winningNumber !== null) throw new Error("DRAW_ALREADY_COMPLETED");
    if (!canDrawCampaign(before)) throw new Error("CAMPAIGN_NOT_READY");
    const reservations = await transaction.get(campaignRef.collection("reservations"));
    const winner = selectWinningReservation(reservations.docs.map((document) => document.data()).filter((reservation) => typeof reservation.number === "number" && typeof reservation.participantName === "string" && typeof reservation.contact === "string"));
    const winningNumber = winner.number as number;
    const now = FieldValue.serverTimestamp();
    transaction.update(campaignRef, { status: "drawn", winningNumber, winnerName: winner.participantName, winnerContact: winner.contact, drawnAt: now, updatedAt: now, drawnBy: actor.uid });
    transaction.create(db.collection("draws").doc(), { campaignId: id, campaignVersion: before.version, numberStart: before.numberStart, numberEnd: before.numberEnd, winningNumber, algorithm: "node:crypto.randomInt", createdAt: now, createdBy: actor.uid });
    transaction.create(db.collection("auditLogs").doc(), { actorId: actor.uid, action: "campaign.drawn", entity: `campaigns/${id}`, after: { winningNumber, campaignVersion: before.version }, createdAt: now });
  });
  const completed = await campaignRef.get();
  return toDTO(completed.id, completed.data()!);
}

export type DashboardDTO = { campaigns: number; publishedCampaigns: number; completedDraws: number; pendingDraws: number };

export async function getDashboard(): Promise<DashboardDTO> {
  const campaigns = await listCampaigns();
  return {
    campaigns: campaigns.length,
    publishedCampaigns: campaigns.filter((campaign) => campaign.status === "published").length,
    completedDraws: campaigns.filter((campaign) => campaign.status === "drawn").length,
    pendingDraws: campaigns.filter((campaign) => campaign.status === "published" || campaign.status === "closed").length,
  };
}
