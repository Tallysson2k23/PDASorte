import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/authorize";
import { hasValidOrigin } from "@/lib/security/request";
import { FirestoreImageStorageProvider } from "@/providers/images/firestore";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  try {
    const actor = await requireAdminPermission("media:upload");
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Selecione uma imagem." }, { status: 400 });
    const stored = await new FirestoreImageStorageProvider().store({ bytes: new Uint8Array(await file.arrayBuffer()), uploadedBy: actor.uid });
    return NextResponse.json({ media: stored }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const message = code === "INVALID_SIZE" ? "A imagem deve ter no máximo 5 MB." : code === "INVALID_TYPE" ? "Use somente JPEG, PNG ou WebP reais." : code === "INVALID_DIMENSIONS" ? "A imagem excede 5000 × 5000 pixels." : code === "STORED_IMAGE_TOO_LARGE" ? "A imagem ficou muito grande após o processamento. Use uma foto mais simples ou menor." : "Não foi possível processar a imagem.";
    return NextResponse.json({ error: message }, { status: code === "FORBIDDEN" ? 403 : 400 });
  }
}
