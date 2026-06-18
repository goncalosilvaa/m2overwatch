import Nav from "@/components/Nav";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { upsertUser, deleteUser } from "./actions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await requireAdmin();

  let users: any[] = [];
  let servers: any[] = [];
  let dbError = "";
  try {
    [users, servers] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: "asc" }, include: { server: { select: { name: true } } } }),
      prisma.server.findMany({ orderBy: { name: "asc" } }),
    ]);
  } catch (e: any) {
    dbError = e?.message || "Erro de ligação à base de dados.";
  }

  return (
    <main>
      <Nav sub="Utilizadores" role={me.role} />
      <div className="max-w-5xl mx-auto px-6 py-6">
        {dbError && (
          <div className="bg-red-500/10 border border-red-500 text-red-300 rounded-xl p-4 mb-5 text-sm">
            <b>Base de dados:</b> {dbError}<br />
            <span className="text-muted">Corre <code>npm run db:push</code> (o schema mudou) e confirma o <code>DATABASE_URL</code>.</span>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="font-bold mb-1">Criar / atualizar utilizador</h2>
          <p className="text-muted text-sm mb-3">
            CLIENT vê só o servidor atribuído. ADMIN gere tudo. (Se o email já existir, atualiza papel/servidor; password só muda se preencheres.)
          </p>
          <form action={upsertUser} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-center">
            <input name="email" type="email" required placeholder="email@cliente.com *" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary" />
            <input name="password" type="text" placeholder="password (conta nova = obrigatória)" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary" />
            <select name="role" defaultValue="CLIENT" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary">
              <option value="CLIENT">Cliente</option>
              <option value="ADMIN">Admin</option>
            </select>
            <select name="serverId" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary">
              <option value="">— servidor (para clientes) —</option>
              {servers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
            <button className="px-4 py-2 rounded-lg bg-primary text-black font-bold">Guardar</button>
          </form>
        </div>

        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-card text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Papel</th>
                <th className="text-left p-3">Servidor</th>
                <th className="text-left p-3">Criado</th>
                <th className="text-right p-3">Acao</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (<tr><td colSpan={5} className="text-center text-muted p-10">Sem utilizadores.</td></tr>)}
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border hover:bg-white/5">
                  <td className="p-3 font-semibold">{u.email}{u.id === me.id && <span className="ml-2 text-[10px] text-muted">(tu)</span>}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${u.role === "ADMIN" ? "bg-primary/20 text-primary" : "bg-white/10 text-muted"}`}>{u.role}</span>
                  </td>
                  <td className="p-3">{u.server?.name || <span className="text-muted">—</span>}</td>
                  <td className="p-3 text-muted whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString("pt-PT")}</td>
                  <td className="p-3 text-right">
                    {u.id === me.id ? (
                      <span className="text-xs text-muted">—</span>
                    ) : (
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="text-xs border border-border rounded-md px-3 py-1.5 hover:border-red-500 hover:text-red-400 text-muted">Remover</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
