"use client";

import { useMemo, useState, type FormEvent } from "react";
import { campaignInputSchema, type CampaignDTO, type CampaignInput } from "@/modules/campaigns/schema";
import type { DashboardDTO } from "@/modules/campaigns/service";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const cents = (value: FormDataEntryValue | null) => Math.round(Number(value) * 100);

const emptyCampaign: CampaignInput = {
  title: "",
  description: "",
  imageUrl: "",
  prizeCents: 50_000,
  numberPriceCents: 500,
  numberStart: 1,
  numberEnd: 100,
  startsAt: new Date().toISOString(),
  salesCloseTime: "16:30",
  drawTime: "17:00",
  timeZone: "America/Recife",
  regulation: "Ambiente de demonstração sem validade comercial. Nenhuma compra ou premiação real.",
  accumulationPolicy: "disabled",
  commissionType: "percentage",
  commissionValue: 0,
  authorizationNumber: "",
  responsibleEntity: "",
  authorizationValidFrom: "",
  authorizationValidUntil: "",
  regulatoryDocumentUrl: "",
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
  const activeCount = useMemo(() => campaigns.filter((campaign) => campaign.status === "demo_active").length, [campaigns]);

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
      const startsAtRaw = String(form.get("startsAt"));
      const input: CampaignInput = {
        title: String(form.get("title")), description: String(form.get("description")), imageUrl,
        prizeCents: cents(form.get("prize")), numberPriceCents: cents(form.get("numberPrice")),
        numberStart: Number(form.get("numberStart")), numberEnd: Number(form.get("numberEnd")),
        startsAt: new Date(startsAtRaw).toISOString(), salesCloseTime: String(form.get("salesCloseTime")), drawTime: String(form.get("drawTime")), timeZone: "America/Recife",
        regulation: String(form.get("regulation")), accumulationPolicy: form.get("accumulationPolicy") as CampaignInput["accumulationPolicy"],
        commissionType: form.get("commissionType") as CampaignInput["commissionType"], commissionValue: Number(form.get("commissionValue")),
        authorizationNumber: String(form.get("authorizationNumber")), responsibleEntity: String(form.get("responsibleEntity")),
        authorizationValidFrom: String(form.get("authorizationValidFrom")), authorizationValidUntil: String(form.get("authorizationValidUntil")),
        regulatoryDocumentUrl: String(form.get("regulatoryDocumentUrl")), status: form.get("status") as CampaignInput["status"],
      };
      const response = await fetch(editing ? `/api/admin/campaigns/${editing.id}` : "/api/admin/campaigns", { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const result = (await response.json()) as { campaign?: CampaignDTO; error?: string };
      if (!response.ok || !result.campaign) throw new Error(result.error ?? "Não foi possível salvar.");
      setCampaigns((current) => editing ? current.map((item) => item.id === result.campaign!.id ? result.campaign! : item) : [result.campaign!, ...current]);
      setEditing(null); setImage(null); setMessage("Campanha salva e versionada com sucesso."); formElement.reset();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha inesperada."); }
    finally { setBusy(false); }
  }

  async function duplicate(campaign: CampaignDTO) {
    setBusy(true); setMessage("");
    const input = campaignInputSchema.parse(campaign);
    try {
      const response = await fetch("/api/admin/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, title: `${input.title} — cópia`, status: "draft" }) });
      const result = (await response.json()) as { campaign?: CampaignDTO; error?: string };
      if (!response.ok || !result.campaign) throw new Error(result.error ?? "Não foi possível duplicar.");
      setCampaigns((current) => [result.campaign!, ...current]); setMessage("Campanha duplicada como rascunho.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Falha inesperada."); } finally { setBusy(false); }
  }

  const values = editing ?? emptyCampaign;
  return (
    <div className="space-y-10">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Campanhas" value={String(campaigns.length)} />
        <Metric label="Demonstrações ativas" value={String(activeCount)} />
        <Metric label="Receita simulada" value={money.format(dashboard.grossRevenueCents / 100)} />
        <Metric label="Números simulados vendidos" value={String(dashboard.soldNumbers)} />
      </section>

      {dashboard.prizeCoverage.filter((item) => item.missingGrossCents > 0).length > 0 && <section className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-6"><h2 className="font-black text-amber-200">Cobertura demonstrativa do prêmio</h2><p className="mt-2 text-sm text-amber-100/70">Os valores abaixo são fictícios e não alteram campanhas automaticamente.</p></section>}

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <div className="flex items-center justify-between"><div><p className="text-sm font-bold text-emerald-300">GESTÃO</p><h2 className="text-2xl font-black">{editing ? "Editar campanha" : "Nova campanha demonstrativa"}</h2></div>{editing && <button onClick={() => setEditing(null)} className="text-sm text-slate-300">Cancelar edição</button>}</div>
        <form key={editing?.id ?? "new"} onSubmit={submit} className="mt-8 grid gap-5 md:grid-cols-2">
          <label className="field">Título<input name="title" defaultValue={values.title} minLength={5} maxLength={120} required /></label>
          <label className="field">Imagem<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] ?? null)} /></label>
          <label className="field md:col-span-2">Descrição<textarea name="description" defaultValue={values.description} minLength={20} maxLength={2000} required /></label>
          <label className="field">Prêmio demonstrativo (R$)<input name="prize" type="number" step="0.01" min="1" defaultValue={values.prizeCents / 100} required /></label>
          <label className="field">Preço por número (R$)<input name="numberPrice" type="number" step="0.01" min="0.01" defaultValue={values.numberPriceCents / 100} required /></label>
          <label className="field">Número inicial<input name="numberStart" type="number" min="0" defaultValue={values.numberStart} required /></label>
          <label className="field">Número final<input name="numberEnd" type="number" min="0" defaultValue={values.numberEnd} required /></label>
          <label className="field">Início<input name="startsAt" type="datetime-local" defaultValue={values.startsAt.slice(0, 16)} required /></label>
          <label className="field">Status<select name="status" defaultValue={values.status}><option value="draft">Rascunho</option><option value="demo_active">Demo ativa</option><option value="paused">Pausada</option><option value="blocked">Bloqueada</option><option value="archived">Arquivada</option></select></label>
          <label className="field">Encerramento diário<input name="salesCloseTime" type="time" defaultValue={values.salesCloseTime} required /></label>
          <label className="field">Sorteio diário<input name="drawTime" type="time" defaultValue={values.drawTime} required /></label>
          <label className="field">Acumulação<select name="accumulationPolicy" defaultValue={values.accumulationPolicy}><option value="disabled">Desativada</option><option value="next_draw">Próximo sorteio</option></select></label>
          <label className="field">Comissão<select name="commissionType" defaultValue={values.commissionType}><option value="percentage">Pontos-base</option><option value="fixed">Centavos fixos</option></select></label>
          <label className="field">Valor da comissão<input name="commissionValue" type="number" min="0" defaultValue={values.commissionValue} required /></label>
          <label className="field">Número da autorização<input name="authorizationNumber" defaultValue={values.authorizationNumber} /></label>
          <label className="field">Entidade responsável<input name="responsibleEntity" defaultValue={values.responsibleEntity} /></label>
          <label className="field">Vigência inicial<input name="authorizationValidFrom" type="date" defaultValue={values.authorizationValidFrom} /></label>
          <label className="field">Vigência final<input name="authorizationValidUntil" type="date" defaultValue={values.authorizationValidUntil} /></label>
          <label className="field md:col-span-2">Documento regulatório<input name="regulatoryDocumentUrl" defaultValue={values.regulatoryDocumentUrl} placeholder="Referência interna ou URL futura" /></label>
          <label className="field md:col-span-2">Regulamento<textarea name="regulation" defaultValue={values.regulation} minLength={20} maxLength={20000} required /></label>
          {message && <p role="status" className="md:col-span-2 rounded-xl bg-white/5 p-3 text-sm text-slate-200">{message}</p>}
          <button disabled={busy} className="rounded-xl bg-emerald-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50 md:col-span-2">{busy ? "Salvando…" : editing ? "Salvar nova versão" : "Criar campanha"}</button>
        </form>
      </section>

      <section><h2 className="text-2xl font-black">Campanhas cadastradas</h2><div className="mt-5 grid gap-4 lg:grid-cols-2">{campaigns.length === 0 ? <p className="text-slate-400">Nenhuma campanha cadastrada.</p> : campaigns.map((campaign) => <article key={campaign.id} className="rounded-2xl border border-white/10 bg-white/5 p-6"><div className="flex justify-between gap-4"><div><span className="text-xs font-bold uppercase text-emerald-300">{campaign.status.replace("_", " ")} · v{campaign.version}</span><h3 className="mt-2 text-xl font-black">{campaign.title}</h3></div><p className="font-bold">{money.format(campaign.prizeCents / 100)}</p></div><p className="mt-3 line-clamp-2 text-sm text-slate-400">{campaign.description}</p><div className="mt-5 flex gap-3"><button onClick={() => { setEditing(campaign); window.scrollTo({ top: 350, behavior: "smooth" }); }} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-bold">Editar</button><button disabled={busy} onClick={() => duplicate(campaign)} className="rounded-lg border border-white/15 px-4 py-2 text-sm font-bold">Duplicar</button></div></article>)}</div></section>
    </div>
  );
}
