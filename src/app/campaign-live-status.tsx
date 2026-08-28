"use client";

import { useEffect, useMemo, useState } from "react";

export function formatRemainingTime(milliseconds: number): string {
  if (milliseconds <= 0) return "Sorteio em andamento";
  const totalSeconds = Math.floor(milliseconds / 1_000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return [days > 0 ? `${days}d` : null, `${String(hours).padStart(2, "0")}h`, `${String(minutes).padStart(2, "0")}m`, `${String(seconds).padStart(2, "0")}s`].filter(Boolean).join(" ");
}

export function CampaignLiveStatus({ campaignId, drawAt, totalNumbers, initialReservedCount }: { campaignId: string; drawAt: string; totalNumbers: number; initialReservedCount: number }) {
  const target = useMemo(() => new Date(drawAt).getTime(), [drawAt]);
  const [now, setNow] = useState(() => Date.now());
  const [reservedCount, setReservedCount] = useState(initialReservedCount);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    async function refreshAvailability() {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/numbers`, { cache: "no-store" });
        const result = (await response.json()) as { reservedNumbers?: number[] };
        if (active && response.ok) setReservedCount(result.reservedNumbers?.length ?? 0);
      } catch {
        // Mantém o último total conhecido quando a conexão oscilar.
      }
    }
    void refreshAvailability();
    const timer = window.setInterval(refreshAvailability, 15_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [campaignId]);

  const available = Math.max(0, totalNumbers - reservedCount);
  return (
    <section className="grid gap-3 sm:grid-cols-2" aria-label="Status do sorteio em tempo real">
      <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5"><p className="text-xs font-black uppercase tracking-wider text-amber-200">Tempo para o sorteio</p><p className="mt-2 font-mono text-2xl font-black text-white" role="timer">{formatRemainingTime(target - now)}</p></div>
      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5"><p className="text-xs font-black uppercase tracking-wider text-emerald-200">Números restantes</p><p className="mt-2 text-3xl font-black text-white" aria-live="polite">{available}</p><p className="mt-1 text-xs text-slate-400">de {totalNumbers} disponíveis</p></div>
    </section>
  );
}
