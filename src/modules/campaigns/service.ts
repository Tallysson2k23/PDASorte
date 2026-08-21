import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { AdminActor } from "@/lib/auth/session";
import { campaignInputSchema, type CampaignDTO, type CampaignInput } from "./schema";

const criticalFields: Array<keyof CampaignInput> = ["prizeCents", "numberPriceCents", "numberStart", "numberEnd", "startsAt", "salesCloseTime", "drawTime", "regulation"];

function iso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : null;
}

function toDTO(id: string, data: Record<string, unknown>): CampaignDTO {
  const input = campaignInputSchema.parse(data);
  return {
    id,
    ...input,
    version: typeof data.version === "number" ? data.version : 1,
    soldCount: typeof data.soldCount === "number" ? data.soldCount : 0,
    grossRevenueCents: typeof data.grossRevenueCents === "number" ? data.grossRevenueCents : 0,
    createdAt: iso(data.createdAt),
    updatedAt: iso(data.updatedAt),
  };
}

export async function listCampaigns(): Promise<CampaignDTO[]> {
  const snapshot = await adminDb().collection("campaigns").orderBy("createdAt", "desc").limit(100).get();
  return snapshot.docs.map((document) => toDTO(document.id, document.data()));
}

export async function createCampaign(rawInput: unknown, actor: AdminActor): Promise<CampaignDTO> {
  const input = campaignInputSchema.parse(rawInput);
  const db = adminDb();
  const campaignRef = db.collection("campaigns").doc();
  const versionRef = db.collection("campaignVersions").doc();
  const auditRef = db.collection("auditLogs").doc();
  const now = FieldValue.serverTimestamp();
  const record = { ...input, version: 1, soldCount: 0, grossRevenueCents: 0, createdAt: now, updatedAt: now, createdBy: actor.uid, demoOnly: true };

  await db.runTransaction(async (transaction) => {
    transaction.create(campaignRef, record);
    transaction.create(versionRef, { campaignId: campaignRef.id, version: 1, snapshot: input, createdAt: now, createdBy: actor.uid, reason: "Criação" });
    transaction.create(auditRef, { actorId: actor.uid, action: "campaign.created", entity: `campaigns/${campaignRef.id}`, after: input, createdAt: now });
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
    const soldCount = typeof before.soldCount === "number" ? before.soldCount : 0;
    if (soldCount > 0 && criticalFields.some((field) => before[field] !== input[field])) throw new Error("LOCKED_AFTER_SALE");
    const version = (typeof before.version === "number" ? before.version : 1) + 1;
    const now = FieldValue.serverTimestamp();
    transaction.update(campaignRef, { ...input, version, updatedAt: now, updatedBy: actor.uid });
    transaction.create(db.collection("campaignVersions").doc(), { campaignId: id, version, snapshot: input, createdAt: now, createdBy: actor.uid, reason: "Edição administrativa" });
    transaction.create(db.collection("auditLogs").doc(), { actorId: actor.uid, action: "campaign.updated", entity: `campaigns/${id}`, before: campaignInputSchema.parse(before), after: input, createdAt: now });
  });
  const updated = await campaignRef.get();
  return toDTO(updated.id, updated.data()!);
}

export type DashboardDTO = {
  campaigns: number;
  demoActiveCampaigns: number;
  grossRevenueCents: number;
  soldNumbers: number;
  pendingPayments: number;
  expiredReservations: number;
  securityAlerts: number;
  prizeCoverage: Array<{ campaignId: string; title: string; prizeCents: number; grossRevenueCents: number; missingGrossCents: number }>;
};

export async function getDashboard(): Promise<DashboardDTO> {
  const campaigns = await listCampaigns();
  return {
    campaigns: campaigns.length,
    demoActiveCampaigns: campaigns.filter((campaign) => campaign.status === "demo_active").length,
    grossRevenueCents: campaigns.reduce((sum, campaign) => sum + campaign.grossRevenueCents, 0),
    soldNumbers: campaigns.reduce((sum, campaign) => sum + campaign.soldCount, 0),
    pendingPayments: 0,
    expiredReservations: 0,
    securityAlerts: 0,
    prizeCoverage: campaigns.map((campaign) => ({ campaignId: campaign.id, title: campaign.title, prizeCents: campaign.prizeCents, grossRevenueCents: campaign.grossRevenueCents, missingGrossCents: Math.max(0, campaign.prizeCents - campaign.grossRevenueCents) })),
  };
}
