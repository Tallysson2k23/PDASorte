import { describe, expect, it } from "vitest";
import { reservationInputSchema } from "./schema";

describe("reserva de número", () => {
  it("aceita nome, telefone e número válidos", () => {
    expect(reservationInputSchema.safeParse({ number: 17, participantName: "Maria Silva", contact: "(81) 99999-9999" }).success).toBe(true);
  });

  it("recusa telefone com conteúdo inesperado", () => {
    expect(reservationInputSchema.safeParse({ number: 17, participantName: "Maria Silva", contact: "contato por e-mail" }).success).toBe(false);
  });

  it("remove campos adicionais enviados pelo navegador", () => {
    const result = reservationInputSchema.parse({ number: 17, participantName: "Maria Silva", contact: "+55 81 99999-9999", isAdmin: true });
    expect(result).not.toHaveProperty("isAdmin");
  });
});
