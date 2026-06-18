import Link from "next/link";
import Nav from "@/components/Nav";
import LiveToggle from "@/components/LiveToggle";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { reasonStyle, scoreColor, HARD_REASONS } from "@/lib/reasons";
import { createBan } from "@/app/bans/actions";
import { addListing } from "@/app/lists/actions";

export const dynamic = "force-dynamic";

const PER_PAGE = 50;
const HOURS_OPTIONS: [number, string][] = [
  [1, "1h"], [6, "6h"], [24, "24h"], [72, "3 dias"], [168, "7 dias"], [720, "30 dias"],
];

function Stat({ n, l, accent }: { n: number; l: string; accent?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`text-3xl font-extrabold ${accent ? "text-accent" : "text-primary"}`}>{n}</div>
      <div className="text-muted text-sm mt-0.5">{l}</div>
    </div>
  );
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { reason?: string; q?: string; hours?: string; page?: string; server?: string };
}) {
  const me = await requireUser();
  const admin = me.role === "ADMIN";

  const q = (searchParams.q || "").trim();
  const reason = (searchParams.reason || "").trim();
  const server = (searchParams.server || "").trim();
  let hours = parseInt(searchParams.hours || "24", 10);
  if (!Number.isFinite(hours) || hours <= 0) hours = 24;
  if (hours > 720) hours = 720;
  let page = parseInt(searchParams.page || "1", 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  // Scope por tenant: admin ve tudo (ou filtra); cliente fica preso ao seu servidor.
  const effServer = admin ? server : (me.serverId ?? "");
  const scope: any = {};
  if (effServer) scope.serverId = effServer;
  else if (!admin) scope.serverId = "__none__";

  const now = Date.now();
  const since24 = new Date(now - 24 * 3600 * 1000);
  const since7d = new Date(now - 7 * 24 * 3600 * 1000);
  const sinceHours = new Date(now - hours * 3600 * 1000);

  let dbError = "";
  let total24 = 0, players24 = 0, fails7d = 0, hard24 = 0, totalRows = 0;
  let byReason: { reason: string; count: number }[] = [];
  let reasons: string[] = [];
  let rows: any[] = [];
  let serverList: any[] = [];
  let listings: any[] = [];
  let bansList: any[] = [];

  const where: any = { ...scope, createdAt: { gte: sinceHours } };
  if (reason) where.reason = reason;
  if (q)
    where.OR = [
      { playerName: { contains: q, mode: "insensitive" } },
      { account: { contains: q, mode: "insensitive" } },
      { ip: { contains: q } },
    ];

  try {
    const [_total24, _players, _fails7d, _hard24, _byReason, _reasonGroups, _totalRows, _rows, _servers, _listings, _bans] =
      await Promise.all([
        prisma.detection.count({ where: { ...scope, createdAt: { gte: since24 } } }),
        prisma.detection.findMany({ where: { ...scope, createdAt: { gte: since24 } }, distinct: ["playerName"], select: { playerName: true } }),
        prisma.detection.count({ where: { ...scope, reason: "CAPTCHA_FAIL", createdAt: { gte: since7d } } }),
        prisma.detection.count({ where: { ...scope, reason: { in: HARD_REASONS }, createdAt: { gte: since24 } } }),
        prisma.detection.groupBy({ by: ["reason"], where: { ...scope, createdAt: { gte: since24 } }, _count: { reason: true } }),
        prisma.detection.groupBy({ by: ["reason"], where: scope, _count: { reason: true } }),
        prisma.detection.count({ where }),
        prisma.detection.findMany({ where, orderBy: { createdAt: "desc" }, take: PER_PAGE, skip: (page - 1) * PER_PAGE, include: { server: true } }),
        admin ? prisma.server.findMany({ orderBy: { name: "asc" } }) : Promise.resolve([]),
        prisma.listing.findMany({ where: scope, take: 2000 }),
        prisma.ban.findMany({ where: scope, select: { playerName: true }, take: 5000 }),
      ]);

    total24 = _total24;
    players24 = _players.length;
    fails7d = _fails7d;
    hard24 = _hard24;
    byReason = _byReason.map((r: any) => ({ reason: r.reason, count: r._count.reason })).sort((a: any, b: any) => b.count - a.count);
    reasons = _reasonGroups.map((r: any) => r.reason).sort();
    totalRows = _totalRows;
    rows = _rows;
    serverList = _servers;
    listings = _listings;
    bansList = _bans;
  } catch (e: any) {
    dbError = e?.message || "Erro de ligação à base de dados.";
  }

  const pages = Math.max(1, Math.ceil(totalRows / PER_PAGE));
  const maxReason = Math.max(1, ...byReason.map((r) => r.count));

  const wl: Record<string, Set<string>> = { player: new Set(), account: new Set(), ip: new Set() };
  const bl: Record<string, Set<string>> = { player: new Set(), account: new Set(), ip: new Set() };
  for (const l of listings) {
    const target = l.list === "WHITE" ? wl : l.list === "BLACK" ? bl : null;
    if (target && target[l.field]) target[l.field].add(l.value);
  }
  const banned = new Set(bansList.map((b) => b.playerName));
  function flags(r: any) {
    const w = wl.player.has(r.playerName) || (r.account && wl.account.has(r.account)) || (r.ip && wl.ip.has(r.ip));
    const b = bl.player.has(r.playerName) || (r.account && bl.account.has(r.account)) || (r.ip && bl.ip.has(r.ip));
    return { w, b, banned: banned.has(r.playerName) };
  }

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (reason) sp.set("reason", reason);
    if (admin && server) sp.set("server", server);
    sp.set("hours", String(hours));
    sp.set("page", String(p));
    return `?${sp.toString()}`;
  }
  function exportHref(fmt: string) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (reason) sp.set("reason", reason);
    if (admin && server) sp.set("server", server);
    sp.set("hours", String(hours));
    sp.set("format", fmt);
    return `/api/export?${sp.toString()}`;
  }

  return (
    <main>
      <Nav sub="Dashboard" role={me.role} />

      <div className="max-w-6xl mx-auto px-6 py-6">
        {dbError && (
          <div className="bg-red-500/10 border border-red-500 text-red-300 rounded-xl p-4 mb-5 text-sm">
            <b>Base de dados:</b> {dbError}
            <br />
            <span className="text-muted">Corre <code>npm run db:push</code> (o schema mudou) e confirma o <code>DATABASE_URL</code> no <code>.env</code>.</span>
          </div>
        )}

        {!admin && (
          <div className="text-muted text-sm mb-4">
            Servidor: <b className="text-white">{me.server?.name ?? "(nenhum atribuído)"}</b>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat n={total24} l="Suspeitas (24h)" />
          <Stat n={players24} l="Jogadores distintos (24h)" />
          <Stat n={hard24} l="Hacks duros (24h)" accent />
          <Stat n={fails7d} l="Captchas falhados (7d)" />
        </div>

        {byReason.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <div className="text-muted mb-3 uppercase tracking-wide text-xs">Por motivo · ultimas 24h</div>
            <div className="flex flex-col gap-2">
              {byReason.map((r) => {
                const st = reasonStyle(r.reason);
                return (
                  <div key={r.reason} className="flex items-center gap-3">
                    <div className="w-32 shrink-0 text-xs text-muted text-right">{st.label}</div>
                    <div className="flex-1 bg-bg rounded h-5 overflow-hidden">
                      <div className="h-full rounded" style={{ width: `${(r.count / maxReason) * 100}%`, background: st.color, minWidth: "2px" }} />
                    </div>
                    <div className="w-10 shrink-0 font-mono text-sm">{r.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
          <form className="flex flex-wrap gap-3 items-center">
            <input name="q" defaultValue={q} placeholder="nome / conta / IP" className="px-3 py-2 rounded-lg bg-card border border-border outline-none focus:border-primary" />
            {admin && (
              <select name="server" defaultValue={server} className="px-3 py-2 rounded-lg bg-card border border-border outline-none focus:border-primary">
                <option value="">Todos os servidores</option>
                {serverList.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            )}
            <select name="reason" defaultValue={reason} className="px-3 py-2 rounded-lg bg-card border border-border outline-none focus:border-primary">
              <option value="">Todos os motivos</option>
              {reasons.map((r) => (<option key={r} value={r}>{reasonStyle(r).label}</option>))}
            </select>
            <select name="hours" defaultValue={String(hours)} className="px-3 py-2 rounded-lg bg-card border border-border outline-none focus:border-primary">
              {HOURS_OPTIONS.map(([h, lbl]) => (<option key={h} value={h}>{lbl}</option>))}
            </select>
            <button className="px-4 py-2 rounded-lg bg-primary text-black font-bold">Filtrar</button>
          </form>

          <div className="flex items-center gap-2">
            <LiveToggle seconds={10} />
            <a href={exportHref("csv")} className="text-sm border border-border rounded-lg px-3 py-2 hover:border-primary text-muted">CSV</a>
            <a href={exportHref("json")} className="text-sm border border-border rounded-lg px-3 py-2 hover:border-primary text-muted">JSON</a>
          </div>
        </div>

        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-card text-muted text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left p-3">Hora</th>
                <th className="text-left p-3">Servidor</th>
                <th className="text-left p-3">Jogador</th>
                <th className="text-left p-3">Conta</th>
                <th className="text-left p-3">IP</th>
                <th className="text-left p-3">Score</th>
                <th className="text-left p-3">Motivo</th>
                <th className="text-left p-3">Sessao</th>
                <th className="text-left p-3">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={9} className="text-center text-muted p-10">Sem detecoes no periodo/filtro selecionado.</td></tr>
              )}
              {rows.map((r) => {
                const st = reasonStyle(r.reason);
                const f = flags(r);
                return (
                  <tr key={r.id.toString()} className={`border-t border-border hover:bg-white/5 ${f.w ? "opacity-50" : ""}`} style={f.b ? { boxShadow: "inset 3px 0 0 #e74c3c" } : undefined}>
                    <td className="p-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleString("pt-PT")}</td>
                    <td className="p-3">{r.server?.name}</td>
                    <td className="p-3 font-semibold">
                      {r.playerName}
                      {f.banned && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 align-middle">banido</span>}
                      {f.w && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 align-middle">WL</span>}
                      {f.b && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 align-middle">BL</span>}
                    </td>
                    <td className="p-3">{r.account}</td>
                    <td className="p-3 font-mono text-xs">{r.ip}</td>
                    <td className="p-3 font-mono font-bold" style={{ color: scoreColor(r.score) }}>{Math.round(r.score)}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs font-bold text-black" style={{ background: st.color }}>{st.label}</span></td>
                    <td className="p-3 whitespace-nowrap">{Math.round((r.sessionSeconds || 0) / 60)}m</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <form action={createBan}>
                          <input type="hidden" name="playerName" value={r.playerName || ""} />
                          <input type="hidden" name="account" value={r.account || ""} />
                          <input type="hidden" name="ip" value={r.ip || ""} />
                          <input type="hidden" name="serverId" value={r.serverId || ""} />
                          <input type="hidden" name="reason" value={r.reason || ""} />
                          <input type="hidden" name="note" value={r.detail || ""} />
                          <button title="Banir jogador" className="text-[11px] border border-border rounded px-2 py-1 hover:border-red-500 hover:text-red-400 text-muted">Ban</button>
                        </form>
                        <form action={addListing}>
                          <input type="hidden" name="list" value="WHITE" />
                          <input type="hidden" name="field" value="player" />
                          <input type="hidden" name="value" value={r.playerName || ""} />
                          <input type="hidden" name="serverId" value={r.serverId || ""} />
                          <button title="Adicionar a whitelist" className="text-[11px] border border-border rounded px-2 py-1 hover:border-green-500 hover:text-green-400 text-muted">WL</button>
                        </form>
                        <form action={addListing}>
                          <input type="hidden" name="list" value="BLACK" />
                          <input type="hidden" name="field" value="player" />
                          <input type="hidden" name="value" value={r.playerName || ""} />
                          <input type="hidden" name="serverId" value={r.serverId || ""} />
                          <button title="Adicionar a blacklist" className="text-[11px] border border-border rounded px-2 py-1 hover:border-red-500 hover:text-red-400 text-muted">BL</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 justify-center items-center mt-5 text-muted text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="border border-border rounded-lg px-3 py-1.5 hover:border-primary">← Anterior</Link>
          ) : (<span className="border border-border/40 rounded-lg px-3 py-1.5 opacity-40">← Anterior</span>)}
          <span>Pagina {page} de {pages} · {totalRows} registos</span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="border border-border rounded-lg px-3 py-1.5 hover:border-primary">Seguinte →</Link>
          ) : (<span className="border border-border/40 rounded-lg px-3 py-1.5 opacity-40">Seguinte →</span>)}
        </div>
      </div>
    </main>
  );
}
