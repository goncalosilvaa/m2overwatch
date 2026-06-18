"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data?.ok) {
        // Navegacao "dura": garante que o cookie acabado de ser definido ja
        // segue no pedido seguinte (evita o "clicar duas vezes" e o bounce).
        window.location.assign("/dashboard");
        return;
      }
      setErr(data?.error || "Credenciais invalidas.");
      setBusy(false);
    } catch {
      setErr("Nao foi possivel contactar o servidor.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <form onSubmit={submit} className="w-[360px] bg-card border border-border rounded-2xl p-8">
        <div className="text-xl font-extrabold mb-1">
          M2<span className="text-primary">Overwatch</span>
        </div>
        <p className="text-muted text-sm mb-6">Painel de gestao anti-cheat</p>

        <label className="text-xs text-muted">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full mt-1 mb-3 px-3 py-2 rounded-lg bg-[#0b1019] border border-border outline-none focus:border-primary"
        />
        <label className="text-xs text-muted">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0b1019] border border-border outline-none focus:border-primary"
        />

        {err && <div className="text-red-400 text-sm mt-3">{err}</div>}

        <button
          disabled={busy}
          className="w-full mt-6 py-3 rounded-lg font-bold bg-primary text-black hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "A entrar..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
