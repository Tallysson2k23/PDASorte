import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getClientKey, hasValidOrigin, isRateLimited } from "@/lib/security/request";
import { listReservedNumbers, reserveNumber } from "@/modules/reservations/service";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return NextResponse.json({ reservedNumbers: await listReservedNumbers(id) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status = code === "NOT_FOUND" ? 404 : code === "CAMPAIGN_NOT_OPEN" ? 409 : 400;
    return NextResponse.json({ error: code === "CAMPAIGN_NOT_OPEN" ? "Esta campanha não está recebendo reservas." : "Campanha não encontrada." }, { status });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasValidOrigin(request)) return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  const { id } = await context.params;
  if (isRateLimited(`reservation:${id}:${getClientKey(request)}`, 12, 60_000)) return NextResponse.json({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });
  try {
    return NextResponse.json({ reservation: await reserveNumber(id, await request.json()) }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Confira o nome, telefone e número escolhidos.", fields: error.flatten().fieldErrors }, { status: 400 });
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const status = code === "NOT_FOUND" ? 404 : code === "NUMBER_UNAVAILABLE" ? 409 : code === "CAMPAIGN_NOT_OPEN" ? 409 : 400;
    const message = code === "NUMBER_UNAVAILABLE" ? "Esse número acabou de ser reservado. Escolha outro." : code === "CAMPAIGN_NOT_OPEN" ? "Esta campanha não está recebendo reservas." : code === "NUMBER_OUT_OF_RANGE" ? "O número está fora do intervalo da campanha." : "Não foi possível reservar o número.";
    return NextResponse.json({ error: message }, { status });
  }
}
