import { afterEach, describe, expect, it } from "vitest";
import { assertInternalUseOnly, getServerEnvironment } from "./env";

const original = process.env.INTERNAL_USE_ONLY;
afterEach(() => { process.env.INTERNAL_USE_ONLY = original; });

describe("uso interno", () => {
  it("é ativado por padrão", () => {
    delete process.env.INTERNAL_USE_ONLY;
    expect(getServerEnvironment().INTERNAL_USE_ONLY).toBe("true");
  });

  it("recusa configuração incompatível", () => {
    process.env.INTERNAL_USE_ONLY = "false";
    expect(() => assertInternalUseOnly()).toThrow();
  });
});
