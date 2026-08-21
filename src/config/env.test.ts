import { afterEach, describe, expect, it } from "vitest";
import { assertDemoMode, getServerEnvironment } from "./env";

const original = process.env.DEMO_MODE;
afterEach(() => { process.env.DEMO_MODE = original; });

describe("modo de demonstração", () => {
  it("é ativado por padrão", () => {
    delete process.env.DEMO_MODE;
    expect(getServerEnvironment().DEMO_MODE).toBe("true");
  });

  it("bloqueia a desativação", () => {
    process.env.DEMO_MODE = "false";
    expect(() => assertDemoMode()).toThrow(/Operação real bloqueada/);
  });
});
