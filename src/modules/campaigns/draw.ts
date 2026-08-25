import { randomInt } from "node:crypto";
import type { CampaignDTO } from "./schema";

export function canDrawCampaign(campaign: Pick<CampaignDTO, "status" | "winningNumber">): boolean {
  return (campaign.status === "published" || campaign.status === "closed") && campaign.winningNumber === null;
}

export function selectWinningReservation<T>(reservations: readonly T[], random: typeof randomInt = randomInt): T {
  if (reservations.length === 0) throw new Error("NO_RESERVATIONS");
  return reservations[random(0, reservations.length)]!;
}
