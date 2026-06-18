import { headers } from "next/headers";
import Nav from "@/components/Nav";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { createServer, toggleServer, regenerateKey } from "./actions";
import CopyButton from "./CopyButton";

export const dynamic = "force-dynamic";

export default async function ServersPage() {
  const me = await requireAdmin();
  const h = headers();
  const host = h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  const origin = `${proto}://${host}`;

  let servers: any[] = [];
  let dbError = "";
  try {
    servers = await prisma.server.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { detections: true } } },
    });
  } catch (e: any) {
    dbError = e?.message || "Erro de ligação à base de dados.";
  }

  return (
    <main>
      <Nav sub="Servidores" role={me.role} />
      <div className="max-w-5xl mx-auto px-6 py-6">
        {dbError && (
          <div className="bg-red-500/10 border border-red-500 text-red-300 rounded-xl p-4 mb-5 text-sm">
            <b>Base de dados:</b> {dbError}<br />
            <span className="text-muted">Corre <code>npm run db:push</code> e confirma o <code>DATABASE_URL</code> no <code>.env</code>.</span>
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="font-bold mb-1">Novo servidor (tenant)</h2>
          <p className="text-muted text-sm mb-4">
            Cria um servidor cliente e gera-lhe uma API key. Essa key e o que o agente/DLL poe no header{" "}
            <code>x-api-key</code> ao reportar.
          </p>
          <form action={createServer} className="flex flex-wrap gap-3 items-center">
            <input name="name" required placeholder="Nome do servidor (ex: SantanaSF)" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary" />
            <input name="ownerEmail" type="email" placeholder="Email do dono (opcional)" className="px-3 py-2 rounded-lg bg-bg border border-border outline-none focus:border-primary" />
            <button className="px-4 py-2 rounded-lg bg-primary text-black font-bold">Criar + gerar key</button>
          </form>
        </div>

        <div className="bg-bg border border-border rounded-xl p-5 mb-6 text-sm">
          <div className="text-muted mb-2 uppercase tracking-wide text-xs">Contrato de ingestao</div>
          <pre className="overflow-x-auto text-xs text-muted font-mono whitespace-pre-wrap">
{`curl -X POST ${origin}/api/ingest \\
  -H "x-api-key: A_API_KEY_DO_SERVIDOR" \\
  -H "content-type: application/json" \\
  -d '{"player":"BotZe","reason":"SPEEDHACK","score":130,"detail":"...","sessionSeconds":1800}'`}
          </pre>
        </div>

        {servers.length === 0 && !dbError ? (
          <div className="text-center text-muted p-10 border border-border rounded-xl">Ainda nao ha servidores. Cria o primeiro acima.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {servers.map((s) => (
              <div key={s.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="font-bold text-base">{s.name}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${s.active ? "bg-green-500/15 text-green-400" : "bg-white/10 text-muted"}`}>
                    {s.active ? "Ativo" : "Inativo"}
                  </span>
                  <span className="text-muted text-xs">{s._count.detections} detecoes · criado {new Date(s.createdAt).toLocaleDateString("pt-PT")}</span>
                  {s.ownerEmail && <span className="text-muted text-xs">· {s.ownerEmail}</span>}
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <code className="text-xs font-mono bg-bg border border-border rounded-md px-2 py-1 break-all">{s.apiKey}</code>
                  <CopyButton value={s.apiKey} />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <form action={toggleServer}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="active" value={String(s.active)} />
                    <button className="text-xs border border-border rounded-md px-3 py-1.5 hover:border-primary text-muted">{s.active ? "Desativar" : "Ativar"}</button>
                  </form>
                  <form action={regenerateKey}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="text-xs border border-border rounded-md px-3 py-1.5 hover:border-primary text-muted">Regenerar key</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
