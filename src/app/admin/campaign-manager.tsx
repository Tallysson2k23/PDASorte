"use client";

import { useMemo, useState, type FormEvent } from "react";
import { campaignInputSchema, type CampaignDTO, type CampaignInput } from "@/modules/campaigns/schema";
import type { DashboardDTO } from "@/modules/campaigns/service";

const statusLabel: Record<CampaignDTO["status"], string> = { draft: "Rascunho", published: "Publicada", closed: "Encerrada", drawn: "Sorteada", archived: "Arquivada" };
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Recife" });

const emptyCampaign: CampaignInput = {
  title: "",
  description: "",
  imageUrl: "",
  prizeDescription: "",
  numberStart: 1,
  numberEnd: 100,
  drawAt: new Date(Date.now() + 86_400_000).toISOString(),
  timeZone: "America/Recife",
  rules: "Participação gratuita e restrita aos integrantes do grupo da faculdade. Cada número participa uma única vez.",
  status: "draft",
};

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}

export function CampaignManager({ initialCampaigns, dashboard }: { initialCampaigns: CampaignDTO[]; dashboard: DashboardDTO }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [editing, setEditing] = useState<CampaignDTO | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const publishedCount = useMemo(() => campaigns.filter((campaign) => campaign.status === "published").length, [campaigns]);
  const completedCount = useMemo(() => campaigns.filter((campaign) => campaign.status === "drawn").length, [campaigns]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData(formElement);
      let imageUrl = editing?.imageUrl ?? "";
      if (image) {
        const upload = new FormData();
        upload.set("file", image);
        const uploadResponse = await fetch("/api/admin/media", { method: "POST", body: upload });
        const uploadResult = (await uploadResponse.json()) as { media?: { cardUrl: string }; error?: string };
        if (!uploadResponse.ok || !uploadResult.media) throw new Error(uploadResult.error ?? "Falha no upload.");
        imageUrl = uploadResult.media.cardUrl;
      }
      const input: CampaignInput = {
        title: String(form.get("title")),
        description: String(form.get("description")),
        imageUrl,
        prizeDescription: String(form.get("prizeDescription")),
        numberStart: Number(form.get("numberStart")),
        numberEnd: Number(form.get("numberEnd")),
        drawAt: new Date(String(form.get("drawAt"))).toISOString(),
        timeZone: "America/Recife",
        rules: String(form.get("rules")),
        status: form.get("status") as CampaignInput["status"],
      };
      const response = await fetch(editing ? `/api/admin/campaigns/${editing.id}` : "/api/admin/campaigns", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const result = (await response.json()) as { campaign?: CampaignDTO; error?: string };
      if (!response.ok || !result.campaign) throw new Error(result.error ?? "Não foi possível salvar.");
      setCampaigns((current) => editing ? current.map((item) => item.id === result.campaign!.id ? result.campaign! : item) : [result.campaign!, ...current]);
      setEditing(null);
      setImage(null);
      setMessage("Campanha salva e registrada no histórico.");
      formElement.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha inesperada.");
    } finally {
      setBusy(false);
    }
  }

  async function duplicate(campaign: CampaignDTO) {
    setBusy(true);
    setMessage("");
    try {
      const input = campaignInputSchema.parse({ ...campaign, status: "draft" });
      const response = await fetch("/api/admin/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, title: `${input.title} — cópia`, status: "draft" }) });
      const result = (await response.json()) as { campaign?: CampaignDTO; error?: string };
      if (!response.ok || !result.campaign) throw new Error(result.error ?? "Não foi possível duplicar.");
      setCampaigns((current) => [result.campaign!, ...current]);
      setMessage("Campanha duplicada como rascunho.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha inesperada.");
    } finally {
      setBusy(false);
    }
  }

  async function draw(campaign: CampaignDTO) {
    if (!window.confirm(`Sortear agora um número entre ${campaign.numberStart} e ${campaign.numberEnd}? O resultado será definitivo.`)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/campaigns/${campaign.id}/draw`, { method: "POST" });
      const result = (await response.json()) as { campaign?: CampaignDTO; error?: string };
      if (!response.ok || !result.campaign) throw new Error(result.error ?? "Não foi possível sortear.");
      setCampaigns((current) => current.map((item) => item.id === result.campaign!.id ? result.campaign! : item));
      setMessage(`Sorteio concluído. Número selecionado: ${result.campaign.winningNumber}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha inesperada.");
    } finally {
      setBusy(false);
    }
  }

  const values = editing ?? emptyCampaign;
  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Campanhas" value={String(campaigns.length || dashboard.campaigns)} />
        <Metric label="Publicadas" value={String(publishedCount)} />
        <Metric label="Sorteios concluídos" value={String(completedCount)} />
        <Metric label="Aguardando sorteio" value={String(campaigns.filter((campaign) => campaign.status === "published" || campaign.status === "closed").length)} />
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <div className="flex items-center justify-between"><div><p className="text-sm font-bold text-emerald-300">ORGANIZAÇÃO</p><h2 className="text-2xl font-black">{editing ? "Editar campanha" : "Novo sorteio"}</h2></div>{editing && <button type="button" onClick={() => setEditing(null)} className="text-sm text-slate-300">Cancelar edição</button>}</div>
        <form key={editing?.id ?? "new"} onSubmit={submit} className="mt-8 grid gap-5 md:grid-cols-2">
          <label className="field">Título<input name="title" defaultValue={values.title} minLength={5} maxLength={120} required /></label>
          <label className="field">Imagem<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} /></label>
          <label className="field md:col-span-2">Descrição<textarea name="description" defaultValue={values.description} minLength={20} maxLength={2000} required /></label>
          <label className="field md:col-span-2">Prêmio simples<input name="prizeDescription" defaultValue={values.prizeDescription} placeholder="Ex.: caixa de chocolates, livro ou brinde" minLength={3} maxLength={300} required /></label>
          <label className="field">Número inicial<input name="numberStart" type="number" min="0" defaultValue={values.numberStart} required /></label>
          <label className="field">Número final<input name="numberEnd" type="number" min="0" defaultValue={values.numberEnd} required /></label>
          <label className="field">Data e hora do sorteio<input name="drawAt" type="datetime-local" defaultValue={values.drawAt.slice(0, 16)} required /></label>
          <label className="field">Status<select name="status" defaultValue={values.status} disabled={values.status === "drawn"}><option value="draft">Rascunho</option><option value="published">Publicada</option><option value="closed">Encerrada</option><option value="archived">Arquivada</option>{values.status === "drawn" && <option value="drawn">Sorteada</option>}</select></label>
          <label className="field md:col-span-2">Regras do grupo<textarea name="rules" defaultValue={values.rules} minLength={20} maxLength={20000} required /></label>
          {message && <p role="status" className="md:col-span-2 rounded-xl bg-white/5 p-3 text-sm text-slate-200">{message}</p>}
          <button disabled={busy || values.status === "drawn"} className="rounded-xl bg-emerald-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50 md:col-span-2">{busy ? "Processando…" : editing ? "Salvar alterações" : "Criar campanha"}</button>
        </form>
      </section>

      <section><h2 className="text-2xl font-black">Campanhas cadastradas</h2><div className="mt-5 grid gap-4 lg:grid-cols-2">{campaigns.length === 0 ? <p className="text-slate-400">Nenhuma campanha cadastrada.</p> : campaigns.map((campaign) => <article key={campaign.id} className="rounded-2xl border border-white/10 bg-white/5 p-6"><div className="flex justify-between gap-4"><div><span className="text-xs font-bold uppercase text-emerald-300">{statusLabel[campaign.status]} · v{campaign.version}</span><h3 className="mt-2 text-xl font-black">{campaign.title}</h3></div>{campaign.winningNumber !== null && <div className="text-right"><p className="text-xs uppercase text-slate-400">Resultado</p><p className="text-3xl font-black text-emerald-300">{campaign.winningNumber}</p></div>}</div><p className="mt-3 line-clamp-2 text-sm text-slate-400">{campaign.description}</p><p className="mt-4 text-sm"><span className="text-slate-500">Prêmio:</span> {campaign.prizeDescription}</p><p className="mt-1 text-sm"><span className="text-slate-500">Sorteio:</span> {dateTime.format(new Date(campaign.drawAt))}</p><p className="mt-1 text-sm"><span className="text-slate-500">Números reservados:</span> {campaign.reservedCount}</p>{campaign.winningNumber !== null && <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4 text-sm"><p className="font-black text-emerald-200">Ganhador</p><p className="mt-2">{campaign.winnerName}</p><p className="text-slate-400">{campaign.winnerContact}</p></div>}<div className="mt-5 flex flex-wrap gap-3">{campaign.status !== "drawn" && <button type="button" onClick={() => { setEditing(campaign); window.scrollTo({ top: 350, behavior: "smooth" }); }} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold">Editar</button>}<button type="button" disabled={busy} onClick={() => duplicate(campaign)} className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold">Duplicar</button>{(campaign.status === "published" || campaign.status === "closed") && <button type="button" disabled={busy || campaign.reservedCount === 0} onClick={() => draw(campaign)} title={campaign.reservedCount === 0 ? "Aguarde pelo menos uma reserva" : undefined} className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-40">Sortear número</button>}</div></article>)}</div></section>
    </div>
  );
}
