import { z } from "zod";

export const reservationInputSchema = z.object({
  number: z.number().int().min(0).max(999_999),
  participantName: z.string().trim().min(2).max(100),
  contact: z.string().trim().min(8).max(30).regex(/^\+?[0-9\s().-]+$/, "Informe um telefone válido."),
});

export type ReservationInput = z.infer<typeof reservationInputSchema>;

export type ReservationDTO = ReservationInput & {
  createdAt: string | null;
};
