import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdminPermission } from "@/lib/auth/authorize";
import { hasValidOrigin } from "@/lib/security/request";
import { createCampaign, listCampaigns } from "@/modules/campaigns/service";

export async function GET() {
  try {
    await requireAdminPermission("campaigns:manage");
    return NextResponse.json({ campaigns: await listCampaigns() });
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  try {
    const actor = await requireAdminPermission("campaigns:manage");
    return NextResponse.json({ campaign: await createCampaign(await request.json(), actor) }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Dados inválidos.", fields: error.flatten().fieldErrors }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error && error.message === "FORBIDDEN" ? "Não autorizado." : "Não foi possível criar a campanha." }, { status: 403 });
  }
}
