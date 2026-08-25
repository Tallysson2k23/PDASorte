import { describe, expect, it, vi } from "vitest";
import { canDrawCampaign, selectWinningReservation } from "./draw";

describe("sorteio interno", () => {
  it("seleciona somente entre reservas existentes", () => {
    const random = vi.fn(() => 2);
    expect(selectWinningReservation([3, 18, 42], random)).toBe(42);
    expect(random).toHaveBeenCalledWith(0, 3);
  });

  it("recusa sorteio sem reservas", () => expect(() => selectWinningReservation([])).toThrow("NO_RESERVATIONS"));

  it("permite sortear apenas campanhas publicadas ou encerradas sem resultado", () => {
    expect(canDrawCampaign({ status: "published", winningNumber: null })).toBe(true);
    expect(canDrawCampaign({ status: "closed", winningNumber: null })).toBe(true);
    expect(canDrawCampaign({ status: "draft", winningNumber: null })).toBe(false);
    expect(canDrawCampaign({ status: "drawn", winningNumber: 7 })).toBe(false);
  });
});
