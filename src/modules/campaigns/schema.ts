import { z } from "zod";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm.");

export const campaignStatusSchema = z.enum(["draft", "demo_active", "paused", "blocked", "archived"]);

export const campaignInputSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(2_000),
  imageUrl: z.string().trim().regex(/^\/uploads\/[a-f0-9-]+-(card|thumb)\.webp$/).or(z.literal("")),
  prizeCents: z.number().int().min(100).max(100_000_000),
  numberPriceCents: z.number().int().min(1).max(10_000_000),
  numberStart: z.number().int().min(0).max(999_999),
  numberEnd: z.number().int().min(0).max(999_999),
  startsAt: z.iso.datetime(),
  salesCloseTime: time,
  drawTime: time,
  timeZone: z.literal("America/Recife"),
  regulation: z.string().trim().min(20).max(20_000),
  accumulationPolicy: z.enum(["disabled", "next_draw"]),
  commissionType: z.enum(["percentage", "fixed"]),
  commissionValue: z.number().int().min(0).max(100_000),
  authorizationNumber: z.string().trim().max(120),
  responsibleEntity: z.string().trim().max(200),
  authorizationValidFrom: z.string().trim().max(30),
  authorizationValidUntil: z.string().trim().max(30),
  regulatoryDocumentUrl: z.string().trim().max(500),
  status: campaignStatusSchema,
}).superRefine((value, context) => {
  if (value.numberEnd < value.numberStart) context.addIssue({ code: "custom", path: ["numberEnd"], message: "O número final deve ser maior ou igual ao inicial." });
  if (value.numberEnd - value.numberStart + 1 > 100_000) context.addIssue({ code: "custom", path: ["numberEnd"], message: "O protótipo aceita no máximo 100.000 números." });
  if (value.drawTime <= value.salesCloseTime) context.addIssue({ code: "custom", path: ["drawTime"], message: "O sorteio deve ocorrer após o encerramento." });
  if (value.commissionType === "percentage" && value.commissionValue > 10_000) context.addIssue({ code: "custom", path: ["commissionValue"], message: "Percentual deve estar entre 0 e 10000 pontos-base." });
});

export type CampaignInput = z.infer<typeof campaignInputSchema>;

export type CampaignDTO = CampaignInput & {
  id: string;
  version: number;
  soldCount: number;
  grossRevenueCents: number;
  createdAt: string | null;
  updatedAt: string | null;
};
