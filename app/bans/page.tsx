import Nav from "@/components/Nav";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { createBan, deleteBan, applyBanInGame } from "./actions";

export const dynamic = "force-dynamic";

function GameStatus({ b }: { b: any }) {
  if (b.executed && !b.executeError)
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-bold" title={b.executedAt ? new Date(b.executedAt).toLocaleString("pt-PT") : ""}>
        Aplicado ✓
      </span>
    );
  if (b.executed && b.executeError)
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold" title={b.executeError}>
        Erro
      </span>
    );
  if (b.executeInGame)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 font-bold">Pendente</span>;
  return <span className="text-muted text-xs">—</span>;
}

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
          <h2 className="font-bold mb-1">Adicionar ban manual</h2>
          <p className="text-muted text-sm mb-3">
            "Aplicar no jogo" marca o ban para o <b>agente</b> o executar na DB de contas
            (<code>account.status = BLOCK</code>) pelo <b>login</b>. Preenche a conta/login para isso funcionar.
          </p>
          <form action={createBan} className="grid sm:grid-cols-2 gap-3">
            <input name="playerName" required placeholder="Nome do jogador *" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary" />
            <input name="account" placeholder="Conta / login (para aplicar no jogo)" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary" />
            <input name="ip" placeholder="IP (opcional)" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary" />
            <input name="email" placeholder="Email (opcional, p/ cruzamento)" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary" />
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
            <label className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
              <input type="checkbox" name="executeInGame" defaultChecked className="w-4 h-4 accent-[#ff7a18]" />
              Aplicar no jogo (BLOCK) através do agente
            </label>
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
                <th className="text-left p-3">Servidor</th>
                <th className="text-left p-3">Motivo</th>
                <th className="text-left p-3">No jogo</th>
                <th className="text-right p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {bans.length === 0 && (<tr><td colSpan={7} className="text-center text-muted p-10">Sem bans.</td></tr>)}
              {bans.map((b) => (
                <tr key={b.id} className="border-t border-border hover:bg-white/5">
                  <td className="p-3 whitespace-nowrap">{new Date(b.createdAt).toLocaleString("pt-PT")}</td>
                  <td className="p-3 font-semibold">{b.playerName}</td>
                  <td className="p-3 font-mono text-xs">{b.account || <span className="text-muted">—</span>}</td>
                  <td className="p-3">{b.server?.name || <span className="text-muted">—</span>}</td>
                  <td className="p-3">{b.reason}</td>
                  <td className="p-3"><GameStatus b={b} /></td>
                  <td className="p-3 text-right">
                    <div className="flex gap-2 justify-end">
                      {(!b.executeInGame || (b.executed && b.executeError)) && (
                        <form action={applyBanInGame}>
                          <input type="hidden" name="id" value={b.id} />
                          <button className="text-xs border border-border rounded-md px-3 py-1.5 hover:border-primary text-muted">
                            {b.executeError ? "Repetir" : "Aplicar no jogo"}
                          </button>
                        </form>
                      )}
                      <form action={deleteBan}>
                        <input type="hidden" name="id" value={b.id} />
                        <button className="text-xs border border-border rounded-md px-3 py-1.5 hover:border-red-500 hover:text-red-400 text-muted">Remover</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted text-xs mt-3">
          O agente de cada servidor aplica os bans pendentes com o utilizador MySQL do anti-cheat. Configura-o no <code>agent/</code>.
        </p>
      </div>
    </main>
  );
}
