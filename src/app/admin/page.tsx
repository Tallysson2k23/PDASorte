import { getAdminActor } from "@/lib/auth/session";
import { LoginForm } from "./login-form";
import { LogoutButton } from "./logout-button";
import { CampaignManager } from "./campaign-manager";
import { getDashboard, listCampaigns } from "@/modules/campaigns/service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const actor = await getAdminActor();
  if (!actor) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white"><LoginForm /></main>;
  }

  const [campaigns, dashboard] = await Promise.all([listCampaigns(), getDashboard()]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="bg-amber-300 px-4 py-2 text-center text-xs font-bold text-slate-950">DEMONSTRAÇÃO — sem vendas, cobranças ou premiações reais</div>
      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div><p className="font-black text-emerald-300">PDA DA SORTE</p><p className="text-sm text-slate-400">Painel administrativo</p></div>
          <div className="flex items-center gap-4"><span className="text-sm text-slate-300">{actor.displayName} · {actor.role}</span><LogoutButton /></div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10"><h1 className="text-3xl font-black">Dashboard demonstrativo</h1><p className="mt-2 text-slate-400">Gestão segura de campanhas fictícias. Nenhum valor representa receita ou prêmio real.</p></div>
        <CampaignManager initialCampaigns={campaigns} dashboard={dashboard} />
      </section>
    </main>
  );
}
