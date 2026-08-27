"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

export function NumberPicker({ campaignId, numberStart, numberEnd }: { campaignId: string; numberStart: number; numberEnd: number }) {
  const [reserved, setReserved] = useState<number[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const reservedSet = useMemo(() => new Set(reserved), [reserved]);
  const numbers = useMemo(() => Array.from({ length: numberEnd - numberStart + 1 }, (_, index) => numberStart + index), [numberStart, numberEnd]);

  useEffect(() => {
    let active = true;
    fetch(`/api/campaigns/${campaignId}/numbers`)
      .then(async (response) => {
        const result = (await response.json()) as { reservedNumbers?: number[]; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Não foi possível carregar os números.");
        if (active) setReserved(result.reservedNumbers ?? []);
      })
      .catch((error: unknown) => active && setMessage(error instanceof Error ? error.message : "Falha ao carregar os números."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [campaignId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected.length === 0) return;
    setSubmitting(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/numbers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers: selected, participantName: String(form.get("participantName")), contact: String(form.get("contact")) }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível reservar.");
      setReserved((current) => [...current, ...selected]);
      setMessage(`${selected.length === 1 ? "Número reservado" : "Números reservados"}: ${selected.join(", ")}. Guarde essa informação.`);
      setSelected([]);
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha inesperada.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="mt-5 text-sm text-slate-400">Carregando números disponíveis…</p>;

  return (
    <div>
      <div className="flex items-center justify-between gap-4"><p className="text-sm font-black">Números disponíveis</p><p className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-bold text-emerald-200">{numbers.length - reserved.length} livres</p></div>
      <div className="mt-5 grid max-h-[32rem] grid-cols-5 gap-3 overflow-y-auto pr-2 sm:grid-cols-8 md:grid-cols-10">
        {numbers.map((number) => {
          const unavailable = reservedSet.has(number);
          const active = selected.includes(number);
          return <button key={number} type="button" disabled={unavailable} onClick={() => setSelected((current) => current.includes(number) ? current.filter((item) => item !== number) : [...current, number].sort((a, b) => a - b))} aria-pressed={active} aria-label={unavailable ? `Número ${number} reservado` : `${active ? "Remover" : "Escolher"} número ${number}`} className={`aspect-square rounded-full text-sm font-black shadow-lg transition ${unavailable ? "cursor-not-allowed border border-red-300/20 bg-red-500/25 text-red-200" : active ? "scale-110 bg-emerald-300 text-slate-950 ring-4 ring-emerald-300/20" : "border border-white/15 bg-slate-800 text-white hover:-translate-y-1 hover:border-emerald-300/50 hover:bg-slate-700"}`}>{number}</button>;
        })}
      </div>

      {selected.length > 0 && <form onSubmit={submit} className="mt-6 space-y-3 rounded-2xl border border-emerald-300/20 bg-slate-900/80 p-5">
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-emerald-300">{selected.length} {selected.length === 1 ? "número selecionado" : "números selecionados"}</p><p className="mt-1 text-sm text-slate-300">{selected.join(", ")}</p></div><button type="button" onClick={() => setSelected([])} className="text-xs font-bold text-slate-400 hover:text-white">Limpar</button></div>
        <label className="field">Seu nome<input name="participantName" autoComplete="name" minLength={2} maxLength={100} required /></label>
        <label className="field">Telefone ou WhatsApp<input name="contact" type="tel" autoComplete="tel" minLength={8} maxLength={30} placeholder="(81) 99999-9999" required /></label>
        <p className="text-xs leading-5 text-slate-500">O contato será usado somente pelo organizador para identificar e avisar o ganhador.</p>
        <button disabled={submitting} className="w-full rounded-xl bg-emerald-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50">{submitting ? "Reservando…" : `Confirmar ${selected.length === 1 ? "reserva" : `${selected.length} reservas`}`}</button>
      </form>}
      {message && <p role="status" className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-slate-200">{message}</p>}
    </div>
  );
}
