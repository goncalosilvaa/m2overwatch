import Nav from "@/components/Nav";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { acknowledgeAlert } from "./actions";

export const dynamic = "force-dynamic";

const MATCH_LABEL: Record<string, string> = {
  ip: "IP",
  name: "Nome",
  account: "Conta",
  email: "Email",
};
const SOURCE_LABEL: Record<string, string> = {
  detection: "Deteção",
  login: "Login",
  register: "Registo",
  ban: "Ban",
};

export default async function AlertsPage() {
  const me = await requireUser();
  const admin = me.role === "ADMIN";
  // CLIENT vê alertas onde o seu servidor é o que viu o jogador OU o que tem o ban.
  const scope: any = admin
    ? {}
    : { OR: [{ seenServerId: me.serverId ?? "__none__" }, { banServerId: me.serverId ?? "__none__" }] };

  let alerts: any[] = [];
  let openCount = 0;
  let dbError = "";
  try {
    [alerts, openCount] = await Promise.all([
      prisma.crossAlert.findMany({ where: scope, orderBy: [{ acknowledged: "asc" }, { createdAt: "desc" }], take: 300 }),
      prisma.crossAlert.count({ where: { ...scope, acknowledged: false } }),
    ]);
  } catch (e: any) {
    dbError = e?.message || "Erro de ligação à base de dados.";
  }

  return (
    <main>
      <Nav sub="Alertas" role={me.role} />
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-5">
          <h1 className="text-lg font-bold">Cruzamento entre servidores</h1>
          {openCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 font-bold ring-1 ring-red-500/30">
              {openCount} por rever
            </span>
          )}
        </div>
        <p className="text-muted text-sm mb-5">
          Um jogador <b>banido</b> num servidor apareceu (deteção/login) noutro servidor que usa o M2Overwatch.
          Match por <b>IP, nome, conta ou email</b>.
        </p>

        {dbError && (
          <div className="bg-red-500/10 border border-red-500 text-red-300 rounded-xl p-4 mb-5 text-sm">
            <b>Base de dados:</b> {dbError}<br />
            <span className="text-muted">Corre <code>npm run db:push</code> (o schema mudou) e confirma o <code>DATABASE_URL</code>.</span>
          </div>
        )}

        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-card text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left p-3">Quando</th>
                <th className="text-left p-3">Jogador</th>
                <th className="text-left p-3">Match</th>
                <th className="text-left p-3">Banido em</th>
                <th className="text-left p-3">Visto em</th>
                <th className="text-left p-3">Origem</th>
                <th className="text-right p-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted p-10">Sem alertas de cruzamento.</td></tr>
              )}
              {alerts.map((a) => (
                <tr key={a.id} className={"border-t border-border " + (a.acknowledged ? "opacity-50" : "hover:bg-white/5")}>
                  <td className="p-3 whitespace-nowrap">{new Date(a.createdAt).toLocaleString("pt-PT")}</td>
                  <td className="p-3 font-semibold">
                    {a.playerName || <span className="text-muted">—</span>}
                    {a.account && <div className="text-xs text-muted font-mono">{a.account}</div>}
                  </td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                      {MATCH_LABEL[a.matchType] || a.matchType}
                    </span>
                    <div className="text-xs text-muted font-mono mt-0.5 break-all">{a.matchValue}</div>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold">{a.banServerName || (a.banServerId ? "—" : "Global")}</span>
                    {a.banReason && <div className="text-xs text-muted">{a.banReason}</div>}
                  </td>
                  <td className="p-3 font-semibold">{a.seenServerName || <span className="text-muted">—</span>}</td>
                  <td className="p-3"><span className="text-xs text-muted">{SOURCE_LABEL[a.source] || a.source}</span></td>
                  <td className="p-3 text-right">
                    {a.acknowledged ? (
                      <span className="text-xs text-muted">Visto ✓</span>
                    ) : (
                      <form action={acknowledgeAlert}>
                        <input type="hidden" name="id" value={a.id} />
                        <button className="text-xs border border-border rounded-md px-3 py-1.5 hover:border-primary text-muted">Marcar visto</button>
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
