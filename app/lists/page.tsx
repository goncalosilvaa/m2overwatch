import Nav from "@/components/Nav";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { addListing, deleteListing } from "./actions";

export const dynamic = "force-dynamic";

const FIELD_LABEL: Record<string, string> = { player: "Jogador", account: "Conta", ip: "IP" };

function ListTable({ title, color, rows }: { title: string; color: string; rows: any[] }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 font-bold" style={{ color }}>
        {title} <span className="text-muted font-normal text-sm">· {rows.length}</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-card text-muted text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left p-3">Tipo</th>
            <th className="text-left p-3">Valor</th>
            <th className="text-left p-3">Servidor</th>
            <th className="text-left p-3">Nota</th>
            <th className="text-right p-3">Acao</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (<tr><td colSpan={5} className="text-center text-muted p-8">Vazio.</td></tr>)}
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border hover:bg-white/5">
              <td className="p-3">{FIELD_LABEL[r.field] || r.field}</td>
              <td className="p-3 font-mono">{r.value}</td>
              <td className="p-3">{r.server?.name || <span className="text-muted">—</span>}</td>
              <td className="p-3 text-muted">{r.note}</td>
              <td className="p-3 text-right">
                <form action={deleteListing}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="text-xs border border-border rounded-md px-3 py-1.5 hover:border-red-500 hover:text-red-400 text-muted">Remover</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ListsPage() {
  const me = await requireUser();
  const admin = me.role === "ADMIN";
  const scope: any = admin ? {} : { serverId: me.serverId ?? "__none__" };

  let listings: any[] = [];
  let servers: any[] = [];
  let dbError = "";
  try {
    [listings, servers] = await Promise.all([
      prisma.listing.findMany({ where: scope, orderBy: { createdAt: "desc" }, include: { server: true }, take: 1000 }),
      admin ? prisma.server.findMany({ orderBy: { name: "asc" } }) : Promise.resolve([]),
    ]);
  } catch (e: any) {
    dbError = e?.message || "Erro de ligação à base de dados.";
  }

  const whites = listings.filter((l) => l.list === "WHITE");
  const blacks = listings.filter((l) => l.list === "BLACK");

  return (
    <main>
      <Nav sub="Listas" role={me.role} />
      <div className="max-w-5xl mx-auto px-6 py-6">
        {dbError && (
          <div className="bg-red-500/10 border border-red-500 text-red-300 rounded-xl p-4 mb-5 text-sm">
            <b>Base de dados:</b> {dbError}<br />
            <span className="text-muted">Corre <code>npm run db:push</code> (o schema mudou) e confirma o <code>DATABASE_URL</code>.</span>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="font-bold mb-1">Adicionar à whitelist / blacklist</h2>
          <p className="text-muted text-sm mb-3">Whitelist = ignorar nas deteções. Blacklist = marcar a vermelho no feed.</p>
          <form action={addListing} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-center">
            <select name="list" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary">
              <option value="WHITE">Whitelist</option>
              <option value="BLACK">Blacklist</option>
            </select>
            <select name="field" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary">
              <option value="player">Jogador</option>
              <option value="account">Conta</option>
              <option value="ip">IP</option>
            </select>
            <input name="value" required placeholder="Valor *" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary" />
            {admin ? (
              <select name="serverId" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary">
                <option value="">Todos os servidores</option>
                {servers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            ) : (
              <input type="hidden" name="serverId" value={me.serverId ?? ""} />
            )}
            <input name="note" placeholder="Nota (opcional)" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary" />
            <button className="px-4 py-2 rounded-lg bg-primary text-black font-bold">Adicionar</button>
          </form>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ListTable title="Whitelist" color="#2ecc71" rows={whites} />
          <ListTable title="Blacklist" color="#e74c3c" rows={blacks} />
        </div>
      </div>
    </main>
  );
}
