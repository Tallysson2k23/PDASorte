import { describe, expect, it } from "vitest";
import { formatRemainingTime } from "./campaign-live-status";

describe("contador do sorteio", () => {
  it("formata dias, horas, minutos e segundos", () => {
    expect(formatRemainingTime((((1 * 24 + 2) * 60 + 3) * 60 + 4) * 1_000)).toBe("1d 02h 03m 04s");
  });

  it("indica quando o horário chegou", () => {
    expect(formatRemainingTime(0)).toBe("Sorteio em andamento");
  });
});
