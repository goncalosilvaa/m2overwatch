import Nav from "@/components/Nav";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { createBan, deleteBan } from "./actions";

export const dynamic = "force-dynamic";

export default async function BansPage() {
  const me = await requireUser();
  const admin = me.role === "ADMIN";
  const scope: any = admin ? {} : { serverId: me.serverId ?? "__none__" };

  let bans: any[] = [];
  let servers: any[] = [];
  let dbError = "";
  try {
    [bans, servers] = await Promise.all([
      prisma.ban.findMany({ where: scope, orderBy: { createdAt: "desc" }, include: { server: true }, take: 500 }),
      admin ? prisma.server.findMany({ orderBy: { name: "asc" } }) : Promise.resolve([]),
    ]);
  } catch (e: any) {
    dbError = e?.message || "Erro de ligação à base de dados.";
  }

  return (
    <main>
      <Nav sub="Bans" role={me.role} />
      <div className="max-w-5xl mx-auto px-6 py-6">
        {dbError && (
          <div className="bg-red-500/10 border border-red-500 text-red-300 rounded-xl p-4 mb-5 text-sm">
            <b>Base de dados:</b> {dbError}<br />
            <span className="text-muted">Corre <code>npm run db:push</code> (o schema mudou) e confirma o <code>DATABASE_URL</code>.</span>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="font-bold mb-3">Adicionar ban manual</h2>
          <form action={createBan} className="grid sm:grid-cols-2 gap-3">
            <input name="playerName" required placeholder="Nome do jogador *" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary" />
            <input name="account" placeholder="Conta (opcional)" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary" />
            <input name="ip" placeholder="IP (opcional)" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary" />
            {admin ? (
              <select name="serverId" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary">
                <option value="">Todos os servidores</option>
                {servers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            ) : (
              <input type="hidden" name="serverId" value={me.serverId ?? ""} />
            )}
            <input name="reason" placeholder="Motivo (ex: SPEEDHACK)" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary" />
            <input name="note" placeholder="Nota (opcional)" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary" />
            <div className="sm:col-span-2"><button className="px-4 py-2 rounded-lg bg-primary text-black font-bold">Banir</button></div>
          </form>
        </div>

        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-card text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left p-3">Data</th>
                <th className="text-left p-3">Jogador</th>
                <th className="text-left p-3">Conta</th>
                <th className="text-left p-3">IP</th>
                <th className="text-left p-3">Servidor</th>
                <th className="text-left p-3">Motivo</th>
                <th className="text-left p-3">Nota</th>
                <th className="text-right p-3">Acao</th>
              </tr>
            </thead>
            <tbody>
              {bans.length === 0 && (<tr><td colSpan={8} className="text-center text-muted p-10">Sem bans.</td></tr>)}
              {bans.map((b) => (
                <tr key={b.id} className="border-t border-border hover:bg-white/5">
                  <td className="p-3 whitespace-nowrap">{new Date(b.createdAt).toLocaleString("pt-PT")}</td>
                  <td className="p-3 font-semibold">{b.playerName}</td>
                  <td className="p-3">{b.account}</td>
                  <td className="p-3 font-mono text-xs">{b.ip}</td>
                  <td className="p-3">{b.server?.name || <span className="text-muted">—</span>}</td>
                  <td className="p-3">{b.reason}</td>
                  <td className="p-3 text-muted">{b.note}</td>
                  <td className="p-3 text-right">
                    <form action={deleteBan}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="text-xs border border-border rounded-md px-3 py-1.5 hover:border-red-500 hover:text-red-400 text-muted">Remover</button>
                    </form>
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
