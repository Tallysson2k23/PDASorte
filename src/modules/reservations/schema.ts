import { z } from "zod";

export const reservationInputSchema = z.object({
  number: z.number().int().min(0).max(999_999),
  participantName: z.string().trim().min(2).max(100),
  contact: z.string().trim().min(8).max(30).regex(/^\+?[0-9\s().-]+$/, "Informe um telefone válido."),
});

export const reservationBatchInputSchema = reservationInputSchema.omit({ number: true }).extend({
  numbers: z.array(z.number().int().min(0).max(999_999)).min(1).max(1_000),
}).superRefine((value, context) => {
  if (new Set(value.numbers).size !== value.numbers.length) context.addIssue({ code: "custom", path: ["numbers"], message: "Não repita números." });
});

export type ReservationInput = z.infer<typeof reservationInputSchema>;
export type ReservationBatchInput = z.infer<typeof reservationBatchInputSchema>;

export type ReservationDTO = ReservationInput & {
  createdAt: string | null;
};
