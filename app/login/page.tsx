import Logo from "@/components/Logo";

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
      <div className="w-[380px]">
        <div className="flex justify-center mb-6">
          <Logo size={34} />
        </div>
        <form
          method="POST"
          action="/api/login"
          className="relative bg-card border border-border rounded-2xl p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]"
        >
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <h1 className="text-lg font-bold">Bem-vindo de volta</h1>
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
            className="w-full mt-1 mb-3 px-3 py-2.5 rounded-xl bg-bg border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
          />
          <label className="text-xs text-muted">Password</label>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full mt-1 px-3 py-2.5 rounded-xl bg-bg border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
          />

          {err && (
            <div className="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
              {err}
            </div>
          )}

          <button className="w-full mt-6 py-3 rounded-xl font-bold bg-primary text-black hover:opacity-95 transition">
            Entrar
          </button>
        </form>
        <p className="text-center text-muted text-xs mt-5">M2Overwatch · proteção anti-cheat server-side</p>
      </div>
    </main>
  );
}
