import Image from "next/image";
import { assertInternalUseOnly } from "@/config/env";
import { listPublicCampaigns } from "@/modules/campaigns/service";
import { NumberPicker } from "./number-picker";

export const dynamic = "force-dynamic";

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Recife" });

export default async function Home() {
  assertInternalUseOnly();
  const campaigns = await listPublicCampaigns();
  const openCampaigns = campaigns.filter((campaign) => campaign.status === "published" || campaign.status === "closed");
  const results = campaigns.filter((campaign) => campaign.status === "drawn");

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div><p className="font-black text-emerald-300">SORTEIOS DA TURMA</p><p className="text-xs text-slate-400">Uso interno do grupo da faculdade</p></div>
          <a href="/admin" className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-slate-300">Organização</a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <span className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200">Gratuito · recreativo · entre colegas</span>
        <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight sm:text-7xl">Um jeito simples e transparente de <span className="text-emerald-300">sortear juntos.</span></h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">Campanhas internas para confraternizações e atividades do grupo. Não há apostas, venda de números, pagamentos ou prêmio em dinheiro.</p>

        <div className="mt-16">
          <div><p className="text-sm font-bold uppercase tracking-widest text-emerald-300">Próximos</p><h2 className="mt-2 text-3xl font-black">Sorteios publicados</h2></div>
          {openCampaigns.length === 0 ? <p className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-400">Nenhum sorteio publicado no momento.</p> : <div className="mt-7 grid gap-6 md:grid-cols-2">{openCampaigns.map((campaign) => <article key={campaign.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">{campaign.imageUrl && <div className="relative aspect-video"><Image src={campaign.imageUrl} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" /></div>}<div className="p-6"><p className="text-xs font-bold uppercase tracking-wider text-emerald-300">{campaign.status === "published" ? "Reservas abertas" : "Participação encerrada"}</p><h3 className="mt-2 text-xl font-black">{campaign.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{campaign.description}</p><dl className="mt-5 space-y-3 border-t border-white/10 pt-5 text-sm"><div><dt className="text-slate-500">Prêmio</dt><dd className="mt-1 font-bold">{campaign.prizeDescription}</dd></div><div><dt className="text-slate-500">Números participantes</dt><dd className="mt-1 font-bold">{campaign.numberStart} a {campaign.numberEnd}</dd></div><div><dt className="text-slate-500">Sorteio</dt><dd className="mt-1 font-bold">{dateTime.format(new Date(campaign.drawAt))}</dd></div></dl><details className="mt-5 text-sm text-slate-300"><summary className="cursor-pointer font-bold text-emerald-200">Ver regras</summary><p className="mt-3 whitespace-pre-wrap leading-6 text-slate-400">{campaign.rules}</p></details>{campaign.status === "published" && <NumberPicker campaignId={campaign.id} numberStart={campaign.numberStart} numberEnd={campaign.numberEnd} />}</div></article>)}</div>}
        </div>

        <div className="mt-20">
          <div><p className="text-sm font-bold uppercase tracking-widest text-amber-300">Histórico</p><h2 className="mt-2 text-3xl font-black">Resultados</h2></div>
          {results.length === 0 ? <p className="mt-6 text-slate-500">Os números sorteados aparecerão aqui.</p> : <div className="mt-7 grid gap-4 md:grid-cols-2">{results.map((campaign) => <article key={campaign.id} className="flex items-center justify-between rounded-2xl border border-amber-300/20 bg-amber-300/5 p-6"><div><p className="text-xs font-bold uppercase text-amber-200">Sorteio concluído</p><h3 className="mt-1 text-lg font-black">{campaign.title}</h3><p className="mt-2 text-sm text-slate-400">{campaign.prizeDescription}</p></div><div className="ml-6 text-center"><p className="text-xs uppercase text-slate-500">Número</p><p className="text-4xl font-black text-amber-300">{campaign.winningNumber}</p></div></article>)}</div>}
        </div>

        <section className="mt-20 grid gap-4 border-t border-white/10 pt-12 sm:grid-cols-3">
          {[["Sem custo", "Ninguém paga para participar."], ["Resultado definitivo", "Cada campanha recebe um único número sorteado."], ["Registro auditável", "O resultado e a versão das regras ficam registrados no Firebase."]].map(([title, description]) => <article key={title} className="rounded-2xl bg-white/5 p-6"><h2 className="font-bold text-emerald-200">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></article>)}
        </section>
      </section>
    </main>
  );
}
