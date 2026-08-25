import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { reservationInputSchema, type ReservationDTO } from "./schema";

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
