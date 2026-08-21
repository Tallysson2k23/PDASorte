import { assertDemoMode } from "@/config/env";

export default function Home() {
  assertDemoMode();
  const cards = [
    ["Sem vendas", "Nenhuma cobrança pode ser iniciada neste ambiente."],
    ["Sem prêmio real", "Resultados futuros serão apenas simulações auditáveis."],
    ["Revisão obrigatória", "A operação depende de aprovação jurídica e regulatória."],
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="border-b border-amber-300/30 bg-amber-300 px-4 py-3 text-center text-sm font-bold text-slate-950">
        Ambiente de demonstração — nenhuma compra ou premiação real
      </div>
      <section className="mx-auto flex min-h-[calc(100vh-44px)] max-w-6xl flex-col justify-center px-6 py-20">
        <span className="mb-6 w-fit rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200">Protótipo em construção</span>
        <h1 className="max-w-4xl text-5xl font-black tracking-tight sm:text-7xl">PDA <span className="text-emerald-300">DA SORTE</span></h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">A fundação segura do sistema está sendo preparada. Campanhas, seleção de números e pagamentos ainda não estão disponíveis.</p>
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {cards.map(([title, description]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="font-bold text-emerald-200">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
