import { describe, expect, it } from "vitest";
import { campaignInputSchema } from "./schema";

const valid = {
  title: "Campanha demonstrativa",
  description: "Descrição completa somente para o ambiente de demonstração.",
  imageUrl: "",
  prizeCents: 50_000,
  numberPriceCents: 500,
  numberStart: 1,
  numberEnd: 100,
  startsAt: "2026-08-20T12:00:00.000Z",
  salesCloseTime: "16:30",
  drawTime: "17:00",
  timeZone: "America/Recife" as const,
  regulation: "Regulamento fictício sem qualquer validade comercial.",
  accumulationPolicy: "disabled" as const,
  commissionType: "percentage" as const,
  commissionValue: 500,
  authorizationNumber: "",
  responsibleEntity: "",
  authorizationValidFrom: "",
  authorizationValidUntil: "",
  regulatoryDocumentUrl: "",
  status: "draft" as const,
};

describe("campanha", () => {
  it("aceita uma demonstração válida", () => expect(campaignInputSchema.safeParse(valid).success).toBe(true));
  it("recusa intervalo invertido", () => expect(campaignInputSchema.safeParse({ ...valid, numberEnd: 0 }).success).toBe(false));
  it("não possui estado comercial real", () => expect(campaignInputSchema.safeParse({ ...valid, status: "active" }).success).toBe(false));
});
