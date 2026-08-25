import { describe, expect, it } from "vitest";
import { campaignInputSchema } from "./schema";

const valid = {
  title: "Sorteio da confraternização",
  description: "Sorteio gratuito e exclusivo para o grupo da faculdade.",
  imageUrl: "",
  prizeDescription: "Uma caixa de chocolates",
  numberStart: 1,
  numberEnd: 100,
  drawAt: "2026-08-30T20:00:00.000Z",
  timeZone: "America/Recife" as const,
  rules: "Cada integrante recebe um número e participa gratuitamente.",
  status: "draft" as const,
};

describe("campanha de sorteio interno", () => {
  it("aceita uma campanha gratuita válida", () => expect(campaignInputSchema.safeParse(valid).success).toBe(true));
  it("recusa intervalo invertido", () => expect(campaignInputSchema.safeParse({ ...valid, numberEnd: 0 }).success).toBe(false));
  it("não aceita estado sorteado pela edição comum", () => expect(campaignInputSchema.safeParse({ ...valid, status: "drawn" }).success).toBe(false));
  it("remove campos comerciais desconhecidos", () => {
    const result = campaignInputSchema.parse({ ...valid, prizeCents: 10_000, numberPriceCents: 500 });
    expect(result).not.toHaveProperty("prizeCents");
    expect(result).not.toHaveProperty("numberPriceCents");
  });
});
