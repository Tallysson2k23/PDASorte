import { describe, expect, it } from "vitest";
import { createDevSession, verifyDevSession } from "./dev-session";

const secret = Buffer.alloc(32, 7);

describe("sessão local assinada", () => {
  it("aceita um token válido", () => {
    const token = createDevSession({ uid: "user-1", email: "demo@example.test", exp: Date.now() + 10_000 }, secret);
    expect(verifyDevSession(token, secret)?.uid).toBe("user-1");
  });

  it("rejeita adulteração e expiração", () => {
    const token = createDevSession({ uid: "user-1", email: null, exp: Date.now() - 1 }, secret);
    expect(verifyDevSession(token, secret)).toBeNull();
    expect(verifyDevSession(`${token}x`, secret)).toBeNull();
  });
});
