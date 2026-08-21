"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (window.location.search) window.history.replaceState(null, "", "/admin");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      const response = await fetch("/api/auth/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: await credential.user.getIdToken(true) }) });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Não foi possível iniciar a sessão.");
      router.replace("/admin");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha no login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form method="post" action="/admin" onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
      <p className="text-sm font-bold text-emerald-300">ACESSO RESTRITO</p>
      <h1 className="mt-2 text-3xl font-black">Painel administrativo</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">Não existe cadastro público. Use uma conta previamente autorizada.</p>
      <label className="mt-8 block text-sm font-semibold" htmlFor="email">E-mail</label>
      <input className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-300" id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <label className="mt-5 block text-sm font-semibold" htmlFor="password">Senha</label>
      <input className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-300" id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} required />
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
      <button disabled={loading} className="mt-6 w-full rounded-xl bg-emerald-300 px-4 py-3 font-bold text-slate-950 disabled:opacity-50">{loading ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}
