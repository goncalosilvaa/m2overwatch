import { Prisma } from "@prisma/client";
import Nav from "@/components/Nav";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { reasonStyle } from "@/lib/reasons";

export const dynamic = "force-dynamic";

function Stat({ n, l, accent }: { n: number | string; l: string; accent?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`text-3xl font-extrabold ${accent ? "text-accent" : "text-primary"}`}>{n}</div>
      <div className="text-muted text-sm mt-0.5">{l}</div>
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; count: number; color?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (rows.length === 0) return <div className="text-muted text-sm p-4">Sem dados.</div>;
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-40 shrink-0 text-xs text-muted text-right truncate" title={r.label}>{r.label}</div>
          <div className="flex-1 bg-bg rounded h-5 overflow-hidden">
            <div className="h-full rounded" style={{ width: `${(r.count / max) * 100}%`, background: r.color || "#ff7a18", minWidth: "2px" }} />
          </div>
          <div className="w-12 shrink-0 font-mono text-sm">{r.count}</div>
        </div>
      ))}
    </div>
  );
}

export default async function AnalyticsPage() {
  const me = await requireUser();
  const admin = me.role === "ADMIN";
  const effServer = admin ? "" : (me.serverId ?? "");
  const scope: any = {};
  if (effServer) scope.serverId = effServer;
  else if (!admin) scope.serverId = "__none__";

  const now = Date.now();
  const since14 = new Date(now - 14 * 86400000);
  const since30 = new Date(now - 30 * 86400000);

  let dbError = "";
  let total30 = 0, hard30 = 0, players30 = 0, avgScore = 0, sevLow = 0, sevMed = 0, sevHigh = 0;
  let trend: { d: Date; c: number }[] = [];
  let topPlayers: { label: string; count: number }[] = [];
  let topReasons: { label: string; count: number; color: string }[] = [];

  const serverCond = scope.serverId ? Prisma.sql`AND "serverId" = ${scope.serverId}` : Prisma.empty;

  try {
    const [_total30, _hard30, _players30, _avg, _trend, _low, _med, _high, _players, _reasons] = await Promise.all([
      prisma.detection.count({ where: { ...scope, createdAt: { gte: since30 } } }),
      prisma.detection.count({ where: { ...scope, reason: { in: ["SPEEDHACK", "ATTACKSPEED_HACK", "ATTACK_DISTANCE_HACK"] }, createdAt: { gte: since30 } } }),
      prisma.detection.findMany({ where: { ...scope, createdAt: { gte: since30 } }, distinct: ["playerName"], select: { playerName: true } }),
      prisma.detection.aggregate({ _avg: { score: true }, where: { ...scope, createdAt: { gte: since30 } } }),
      (prisma.$queryRaw(Prisma.sql`
        SELECT date_trunc('day', "createdAt") AS d, count(*)::int AS c
        FROM "Detection"
        WHERE "createdAt" >= ${since14} ${serverCond}
        GROUP BY 1 ORDER BY 1`) as Promise<{ d: Date; c: number }[]>),
      prisma.detection.count({ where: { ...scope, createdAt: { gte: since30 }, score: { lt: 60 } } }),
      prisma.detection.count({ where: { ...scope, createdAt: { gte: since30 }, score: { gte: 60, lt: 120 } } }),
      prisma.detection.count({ where: { ...scope, createdAt: { gte: since30 }, score: { gte: 120 } } }),
      prisma.detection.groupBy({ by: ["playerName"], where: { ...scope, createdAt: { gte: since30 } }, _count: { playerName: true }, orderBy: { _count: { playerName: "desc" } }, take: 10 }),
      prisma.detection.groupBy({ by: ["reason"], where: { ...scope, createdAt: { gte: since30 } }, _count: { reason: true } }),
    ]);

    total30 = _total30;
    hard30 = _hard30;
    players30 = _players.length;
    avgScore = Math.round(_avg._avg.score || 0);
    trend = _trend;
    sevLow = _low; sevMed = _med; sevHigh = _high;
    topPlayers = _players.map((p: any) => ({ label: p.playerName, count: p._count.playerName }));
    topReasons = _reasons
      .map((r: any) => ({ label: reasonStyle(r.reason).label, count: r._count.reason, color: reasonStyle(r.reason).color }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 12);
  } catch (e: any) {
    dbError = e?.message || "Erro de ligação à base de dados.";
  }

  const days: { key: string; label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    days.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }), count: 0 });
  }
  const dayMap = new Map(days.map((d) => [d.key, d]));
  for (const row of trend) {
    const key = new Date(row.d).toISOString().slice(0, 10);
    const item = dayMap.get(key);
    if (item) item.count = Number(row.c);
  }
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  return (
    <main>
      <Nav sub="Analytics" role={me.role} />
      <div className="max-w-6xl mx-auto px-6 py-6">
        {dbError && (
          <div className="bg-red-500/10 border border-red-500 text-red-300 rounded-xl p-4 mb-5 text-sm">
            <b>Base de dados:</b> {dbError}
            <br />
            <span className="text-muted">Corre <code>npm run db:push</code> (o schema mudou) e confirma o <code>DATABASE_URL</code>.</span>
          </div>
        )}

        {!admin && (
          <div className="text-muted text-sm mb-4">Servidor: <b className="text-white">{me.server?.name ?? "(nenhum atribuído)"}</b></div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Stat n={total30} l="Deteções (30d)" />
          <Stat n={hard30} l="Hacks duros (30d)" accent />
          <Stat n={players30} l="Jogadores distintos (30d)" />
          <Stat n={avgScore} l="Score médio (30d)" />
        </div>

        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="text-muted mb-4 uppercase tracking-wide text-xs">Tendência · últimos 14 dias</div>
          <div className="flex items-end gap-1.5 h-44">
            {days.map((d) => (
              <div key={d.key} className="flex-1 flex flex-col items-center gap-1 h-full justify-end" title={`${d.label}: ${d.count}`}>
                <div className="text-[10px] font-mono text-muted">{d.count || ""}</div>
                <div className="w-full bg-primary/80 rounded-t" style={{ height: `${(d.count / maxDay) * 100}%`, minHeight: "2px" }} />
                <div className="text-[9px] text-muted">{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-muted mb-4 uppercase tracking-wide text-xs">Severidade por score · 30 dias</div>
            <Bars rows={[
              { label: "Baixa (<60)", count: sevLow, color: "#8b97a7" },
              { label: "Média (60–119)", count: sevMed, color: "#e67e22" },
              { label: "Alta (≥120)", count: sevHigh, color: "#e74c3c" },
            ]} />
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="text-muted mb-4 uppercase tracking-wide text-xs">Hacks mais frequentes · 30 dias</div>
            <Bars rows={topReasons} />
          </div>
          <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2">
            <div className="text-muted mb-4 uppercase tracking-wide text-xs">Top jogadores sinalizados · 30 dias</div>
            <Bars rows={topPlayers} />
          </div>
        </div>
      </div>
    </main>
  );
}
