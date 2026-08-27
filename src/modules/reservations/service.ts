import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { reservationBatchInputSchema, reservationInputSchema, type ReservationDTO } from "./schema";

function validCampaignId(id: string): boolean {
  return /^[A-Za-z0-9_-]{1,128}$/.test(id);
}

function numberDocumentId(number: number): string {
  return String(number).padStart(6, "0");
}

function iso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return typeof value === "string" ? value : null;
}

export async function listReservedNumbers(campaignId: string): Promise<number[]> {
  if (!validCampaignId(campaignId)) throw new Error("INVALID_ID");
  const db = adminDb();
  const campaign = await db.collection("campaigns").doc(campaignId).get();
  if (!campaign.exists) throw new Error("NOT_FOUND");
  const status = campaign.data()?.status;
  if (status !== "published") throw new Error("CAMPAIGN_NOT_OPEN");
  const reservations = await campaign.ref.collection("reservations").select("number").get();
  return reservations.docs.map((document) => document.data().number).filter((number): number is number => typeof number === "number").sort((a, b) => a - b);
}

export async function reserveNumber(campaignId: string, rawInput: unknown): Promise<ReservationDTO> {
  if (!validCampaignId(campaignId)) throw new Error("INVALID_ID");
  const input = reservationInputSchema.parse(rawInput);
  const db = adminDb();
  const campaignRef = db.collection("campaigns").doc(campaignId);
  const reservationRef = campaignRef.collection("reservations").doc(numberDocumentId(input.number));

  await db.runTransaction(async (transaction) => {
    const [campaign, existingReservation] = await Promise.all([transaction.get(campaignRef), transaction.get(reservationRef)]);
    if (!campaign.exists) throw new Error("NOT_FOUND");
    const data = campaign.data()!;
    if (data.status !== "published" || typeof data.winningNumber === "number") throw new Error("CAMPAIGN_NOT_OPEN");
    if (input.number < data.numberStart || input.number > data.numberEnd) throw new Error("NUMBER_OUT_OF_RANGE");
    if (existingReservation.exists) throw new Error("NUMBER_UNAVAILABLE");
    const now = FieldValue.serverTimestamp();
    transaction.create(reservationRef, { ...input, createdAt: now });
    transaction.update(campaignRef, { reservedCount: FieldValue.increment(1), updatedAt: now });
    transaction.create(db.collection("auditLogs").doc(), { actorId: "public-participant", action: "number.reserved", entity: `campaigns/${campaignId}/reservations/${numberDocumentId(input.number)}`, after: { number: input.number }, createdAt: now });
  });

  const created = await reservationRef.get();
  const data = created.data()!;
  return { number: data.number, participantName: data.participantName, contact: data.contact, createdAt: iso(data.createdAt) };
}

export async function reserveNumbers(campaignId: string, rawInput: unknown): Promise<ReservationDTO[]> {
  if (!validCampaignId(campaignId)) throw new Error("INVALID_ID");
  const input = reservationBatchInputSchema.parse(rawInput);
  const numbers = [...input.numbers].sort((a, b) => a - b);
  const db = adminDb();
  const campaignRef = db.collection("campaigns").doc(campaignId);
  const reservationRefs = numbers.map((number) => campaignRef.collection("reservations").doc(numberDocumentId(number)));

  await db.runTransaction(async (transaction) => {
    const [campaign, ...existingReservations] = await Promise.all([transaction.get(campaignRef), ...reservationRefs.map((ref) => transaction.get(ref))]);
    if (!campaign.exists) throw new Error("NOT_FOUND");
    const data = campaign.data()!;
    if (data.status !== "published" || typeof data.winningNumber === "number") throw new Error("CAMPAIGN_NOT_OPEN");
    if (numbers.some((number) => number < data.numberStart || number > data.numberEnd)) throw new Error("NUMBER_OUT_OF_RANGE");
    if (existingReservations.some((reservation) => reservation.exists)) throw new Error("NUMBER_UNAVAILABLE");
    const now = FieldValue.serverTimestamp();
    numbers.forEach((number, index) => transaction.create(reservationRefs[index]!, { number, participantName: input.participantName, contact: input.contact, createdAt: now }));
    transaction.update(campaignRef, { reservedCount: FieldValue.increment(numbers.length), updatedAt: now });
    transaction.create(db.collection("auditLogs").doc(), { actorId: "public-participant", action: "numbers.reserved", entity: `campaigns/${campaignId}/reservations`, after: { numbers }, createdAt: now });
  });

  return numbers.map((number) => ({ number, participantName: input.participantName, contact: input.contact, createdAt: null }));
}

export type AdminReservationDTO = {
  campaignId: string;
  campaignTitle: string;
  participantName: string;
  contact: string;
  numbers: number[];
  createdAt: string | null;
};

export async function listRecentReservations(campaigns: Array<{ id: string; title: string }>): Promise<AdminReservationDTO[]> {
  const snapshots = await Promise.all(campaigns.map(async (campaign) => ({
    campaign,
    snapshot: await adminDb().collection("campaigns").doc(campaign.id).collection("reservations").orderBy("createdAt", "desc").limit(200).get(),
  })));
  const grouped = new Map<string, AdminReservationDTO>();
  for (const { campaign, snapshot } of snapshots) {
    for (const document of snapshot.docs) {
      const data = document.data();
      if (typeof data.number !== "number" || typeof data.participantName !== "string" || typeof data.contact !== "string") continue;
      const createdAt = iso(data.createdAt);
      const key = `${campaign.id}|${data.participantName}|${data.contact}|${createdAt ?? document.id}`;
      const existing = grouped.get(key);
      if (existing) existing.numbers.push(data.number);
      else grouped.set(key, { campaignId: campaign.id, campaignTitle: campaign.title, participantName: data.participantName, contact: data.contact, numbers: [data.number], createdAt });
    }
  }
  return [...grouped.values()]
    .map((reservation) => ({ ...reservation, numbers: reservation.numbers.sort((a, b) => a - b) }))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 200);
}
