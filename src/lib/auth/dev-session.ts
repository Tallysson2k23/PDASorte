import { createHmac, timingSafeEqual } from "node:crypto";

type Payload = { uid: string; email: string | null; exp: number };

export function createDevSession(payload: Payload, secret: Buffer): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `dev.${encoded}.${signature}`;
}

export function verifyDevSession(token: string, secret: Buffer): Payload | null {
  const [prefix, encoded, signature] = token.split(".");
  if (prefix !== "dev" || !encoded || !signature) return null;
  const expected = createHmac("sha256", secret).update(encoded).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Payload;
    if (!payload.uid || typeof payload.exp !== "number" || payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
