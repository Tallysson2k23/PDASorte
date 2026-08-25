import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/authorize";
import { hasValidOrigin } from "@/lib/security/request";
import { drawCampaign } from "@/modules/campaigns/service";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  try {
    const actor = await requireAdminPermission("campaigns:manage");
    const { id } = await context.params;
    return NextResponse.json({ campaign: await drawCampaign(id, actor) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status = code === "NOT_FOUND" ? 404 : code === "FORBIDDEN" ? 403 : code === "DRAW_ALREADY_COMPLETED" || code === "CAMPAIGN_NOT_READY" || code === "NO_RESERVATIONS" ? 409 : 500;
    const message = code === "DRAW_ALREADY_COMPLETED" ? "Esta campanha já foi sorteada." : code === "CAMPAIGN_NOT_READY" ? "Publique ou encerre a campanha antes do sorteio." : code === "NO_RESERVATIONS" ? "Ainda não existe nenhum número reservado nesta campanha." : code === "NOT_FOUND" ? "Campanha não encontrada." : "Não foi possível realizar o sorteio.";
    return NextResponse.json({ error: message }, { status });
  }
}
