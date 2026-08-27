import { getAdminActor } from "@/lib/auth/session";
import { LoginForm } from "./login-form";
import { LogoutButton } from "./logout-button";
import { CampaignManager } from "./campaign-manager";
import { getDashboard, listCampaigns } from "@/modules/campaigns/service";
import { listRecentReservations } from "@/modules/reservations/service";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const actor = await getAdminActor();
  if (!actor) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white"><LoginForm /></main>;
  }

  const campaigns = await listCampaigns();
  const [dashboard, reservations] = await Promise.all([getDashboard(), listRecentReservations(campaigns)]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="bg-emerald-300 px-4 py-2 text-center text-xs font-bold text-slate-950">USO INTERNO — sorteios gratuitos para o grupo da faculdade</div>
      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div><p className="font-black text-emerald-300">SORTEIOS DA TURMA</p><p className="text-sm text-slate-400">Painel de organização</p></div>
          <div className="flex items-center gap-4"><span className="text-sm text-slate-300">{actor.displayName} · {actor.role}</span><LogoutButton /></div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10"><h1 className="text-3xl font-black">Sorteios do grupo</h1><p className="mt-2 text-slate-400">Crie campanhas, publique as regras e sorteie um número com registro auditável.</p></div>
        <CampaignManager initialCampaigns={campaigns} dashboard={dashboard} initialReservations={reservations} />
      </section>
    </main>
  );
}
