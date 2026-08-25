import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdminPermission } from "@/lib/auth/authorize";
import { hasValidOrigin } from "@/lib/security/request";
import { updateCampaign } from "@/modules/campaigns/service";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  try {
    const actor = await requireAdminPermission("campaigns:manage");
    const { id } = await context.params;
    return NextResponse.json({ campaign: await updateCampaign(id, await request.json(), actor) });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Dados inválidos.", fields: error.flatten().fieldErrors }, { status: 400 });
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status = code === "NOT_FOUND" ? 404 : code === "DRAW_ALREADY_COMPLETED" || code === "RESERVATIONS_LOCK_RANGE" ? 409 : code === "FORBIDDEN" ? 403 : 500;
    const message = code === "DRAW_ALREADY_COMPLETED" ? "Um sorteio concluído não pode ser alterado." : code === "RESERVATIONS_LOCK_RANGE" ? "O intervalo não pode ser alterado depois que existem números reservados." : code === "NOT_FOUND" ? "Campanha não encontrada." : "Não foi possível atualizar a campanha.";
    return NextResponse.json({ error: message }, { status });
  }
}
