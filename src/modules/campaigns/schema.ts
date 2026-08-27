import { z } from "zod";

export const campaignStatusSchema = z.enum(["draft", "published", "closed", "drawn", "archived"]);

export const campaignInputSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(2_000),
  imageUrl: z.string().trim().regex(/^\/(?:uploads\/[a-f0-9-]+-(?:card|thumb)\.webp|api\/media\/[a-f0-9-]{36}\/(?:card|thumb))$/).or(z.literal("")),
  prizeDescription: z.string().trim().min(3).max(300),
  numberStart: z.number().int().min(0).max(999_999),
  numberEnd: z.number().int().min(0).max(999_999),
  drawAt: z.iso.datetime(),
  timeZone: z.literal("America/Recife"),
  rules: z.string().trim().min(20).max(20_000),
  status: campaignStatusSchema.exclude(["drawn"]),
}).superRefine((value, context) => {
  if (value.numberEnd < value.numberStart) context.addIssue({ code: "custom", path: ["numberEnd"], message: "O número final deve ser maior ou igual ao inicial." });
  if (value.numberEnd - value.numberStart + 1 > 1_000) context.addIssue({ code: "custom", path: ["numberEnd"], message: "O sorteio interno aceita no máximo 1.000 números." });
});

export type CampaignInput = z.infer<typeof campaignInputSchema>;

export type CampaignDTO = Omit<CampaignInput, "status"> & {
  id: string;
  status: z.infer<typeof campaignStatusSchema>;
  version: number;
  reservedCount: number;
  winningNumber: number | null;
  winnerName: string | null;
  winnerContact: string | null;
  drawnAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
