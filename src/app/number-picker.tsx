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
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="flex items-center justify-between gap-4"><p className="text-sm font-black">Escolha seu número</p><p className="text-xs text-slate-500">{numbers.length - reserved.length} disponíveis</p></div>
      <div className="mt-4 grid max-h-56 grid-cols-5 gap-2 overflow-y-auto pr-1 sm:grid-cols-8">
        {numbers.map((number) => {
          const unavailable = reservedSet.has(number);
          const active = selected === number;
          return <button key={number} type="button" disabled={unavailable} onClick={() => setSelected(number)} aria-label={unavailable ? `Número ${number} reservado` : `Escolher número ${number}`} className={`rounded-lg px-2 py-2 text-xs font-bold transition ${unavailable ? "cursor-not-allowed bg-white/5 text-slate-700 line-through" : active ? "bg-emerald-300 text-slate-950 ring-2 ring-emerald-100" : "bg-white/10 text-slate-200 hover:bg-white/20"}`}>{number}</button>;
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
