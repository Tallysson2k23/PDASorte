import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string; variant: string }> }) {
  const { id, variant } = await context.params;
  if (!/^[a-f0-9-]{36}$/.test(id) || (variant !== "card" && variant !== "thumb")) {
    return NextResponse.json({ error: "Imagem inválida." }, { status: 400 });
  }
  const snapshot = await adminDb().collection("media").doc(id).collection("variants").doc(variant).get();
  const data = snapshot.data();
  if (!snapshot.exists || !data?.bytes) return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
  const bytes = data.bytes.toUint8Array ? data.bytes.toUint8Array() : data.bytes;
  return new NextResponse(bytes, { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" } });
}
