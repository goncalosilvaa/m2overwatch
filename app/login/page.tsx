export const dynamic = "force-dynamic";

export default function LoginPage({ searchParams }: { searchParams: { e?: string } }) {
  const err =
    searchParams?.e === "2"
      ? "Erro de ligacao a base de dados. Confirma o DATABASE_URL."
      : searchParams?.e
      ? "Credenciais invalidas."
      : "";

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <form method="POST" action="/api/login" className="w-[360px] bg-card border border-border rounded-2xl p-8">
        <div className="text-xl font-extrabold mb-1">
          M2<span className="text-primary">Overwatch</span>
        </div>
        <p className="text-muted text-sm mb-6">Painel de gestao anti-cheat</p>

        <label className="text-xs text-muted">Email</label>
        <input
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          className="w-full mt-1 mb-3 px-3 py-2 rounded-lg bg-[#0b1019] border border-border outline-none focus:border-primary"
        />
        <label className="text-xs text-muted">Password</label>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full mt-1 px-3 py-2 rounded-lg bg-[#0b1019] border border-border outline-none focus:border-primary"
        />

        {err && <div className="text-red-400 text-sm mt-3">{err}</div>}

        <button className="w-full mt-6 py-3 rounded-lg font-bold bg-primary text-black hover:opacity-90">
          Entrar
        </button>
      </form>
    </main>
  );
}
