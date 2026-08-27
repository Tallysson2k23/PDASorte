import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { assertInternalUseOnly } from "@/config/env";
import { getPublicCampaign } from "@/modules/campaigns/service";
import { NumberPicker } from "../../number-picker";

export const dynamic = "force-dynamic";

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Recife" });

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  assertInternalUseOnly();
  const { id } = await params;
  const campaign = await getPublicCampaign(id);
  if (!campaign) notFound();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10"><div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5"><Link href="/" className="font-black text-emerald-300">← SORTEIOS DA TURMA</Link><span className="text-xs text-slate-500">Uso interno</span></div></header>
      <article className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
          {campaign.imageUrl && <div className="relative aspect-[16/8] bg-slate-900"><Image src={campaign.imageUrl} alt="" fill priority sizes="(min-width: 1024px) 960px, 100vw" className="object-cover" /></div>}
          <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[1fr_320px]">
            <section>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">{campaign.status === "published" ? "Participação aberta" : campaign.status === "drawn" ? "Sorteio concluído" : "Participação encerrada"}</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{campaign.title}</h1>
              <p className="mt-5 whitespace-pre-wrap text-base leading-8 text-slate-300">{campaign.description}</p>
              <div className="mt-8 rounded-2xl border border-white/10 bg-slate-950/60 p-5"><h2 className="font-black text-emerald-200">Regras</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-400">{campaign.rules}</p></div>
            </section>
            <aside className="h-fit rounded-2xl border border-white/10 bg-slate-950/60 p-6">
              <dl className="space-y-5 text-sm"><div><dt className="text-slate-500">Prêmio</dt><dd className="mt-1 text-lg font-black">{campaign.prizeDescription}</dd></div><div><dt className="text-slate-500">Faixa de números</dt><dd className="mt-1 font-bold">{campaign.numberStart} a {campaign.numberEnd}</dd></div><div><dt className="text-slate-500">Data do sorteio</dt><dd className="mt-1 font-bold">{dateTime.format(new Date(campaign.drawAt))}</dd></div></dl>
              {campaign.status === "drawn" && <div className="mt-6 rounded-2xl bg-amber-300 p-5 text-center text-slate-950"><p className="text-xs font-black uppercase">Número sorteado</p><p className="mt-1 text-5xl font-black">{campaign.winningNumber}</p></div>}
            </aside>
          </div>
        </div>
        {campaign.status === "published" && <section className="mt-8 rounded-[2rem] border border-emerald-300/20 bg-white/5 p-6 sm:p-10"><div className="mb-7"><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Participar</p><h2 className="mt-2 text-3xl font-black">Escolha uma bola</h2><p className="mt-2 text-sm text-slate-400">As bolas apagadas já foram escolhidas.</p></div><NumberPicker campaignId={campaign.id} numberStart={campaign.numberStart} numberEnd={campaign.numberEnd} /></section>}
      </article>
    </main>
  );
}
