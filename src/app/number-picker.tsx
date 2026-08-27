"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";

export function NumberPicker({ campaignId, numberStart, numberEnd }: { campaignId: string; numberStart: number; numberEnd: number }) {
  const [reserved, setReserved] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
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
    if (selected === null) return;
    setSubmitting(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/numbers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: selected, participantName: String(form.get("participantName")), contact: String(form.get("contact")) }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível reservar.");
      setReserved((current) => [...current, selected]);
      setMessage(`Número ${selected} reservado com sucesso! Guarde essa informação.`);
      setSelected(null);
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
          const active = selected === number;
          return <button key={number} type="button" disabled={unavailable} onClick={() => setSelected(number)} aria-label={unavailable ? `Número ${number} reservado` : `Escolher número ${number}`} className={`aspect-square rounded-full text-sm font-black shadow-lg transition ${unavailable ? "cursor-not-allowed border border-white/5 bg-white/[0.03] text-slate-700" : active ? "scale-110 bg-emerald-300 text-slate-950 ring-4 ring-emerald-300/20" : "border border-white/15 bg-slate-800 text-white hover:-translate-y-1 hover:border-emerald-300/50 hover:bg-slate-700"}`}>{number}</button>;
        })}
      </div>

      {selected !== null && <form onSubmit={submit} className="mt-5 space-y-3 rounded-2xl bg-slate-900/80 p-4">
        <p className="text-sm font-bold text-emerald-300">Reservar o número {selected}</p>
        <label className="field">Seu nome<input name="participantName" autoComplete="name" minLength={2} maxLength={100} required /></label>
        <label className="field">Telefone ou WhatsApp<input name="contact" type="tel" autoComplete="tel" minLength={8} maxLength={30} placeholder="(81) 99999-9999" required /></label>
        <p className="text-xs leading-5 text-slate-500">O contato será usado somente pelo organizador para identificar e avisar o ganhador.</p>
        <button disabled={submitting} className="w-full rounded-xl bg-emerald-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50">{submitting ? "Reservando…" : "Confirmar reserva"}</button>
      </form>}
      {message && <p role="status" className="mt-4 rounded-xl bg-white/5 p-3 text-sm text-slate-200">{message}</p>}
    </div>
  );
}
