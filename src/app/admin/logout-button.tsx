"use client";

export function LogoutButton() {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  }
  return <button onClick={logout} className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5">Sair</button>;
}
