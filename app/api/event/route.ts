import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkCrossServerSeen } from "@/lib/cross";

// Eventos LEVES de presença: login / registo. NÃO cria deteção — só faz o
// cruzamento entre servidores (avisar se o jogador está banido noutro lado).
// Mesma autenticação por x-api-key do /api/ingest.
export const dynamic = "force-dynamic";

const schema = z.object({
  type: z.enum(["login", "register"]).default("login"),
  player: z.string().max(64).optional(),
  account: z.string().max(64).optional(),
  ip: z.string().max(64).optional(),
  email: z.string().max(128).optional(),
});

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return NextResponse.json({ error: "missing api key" }, { status: 401 });

  const server = await prisma.server.findUnique({ where: { apiKey } });
  if (!server || !server.active) {
    return NextResponse.json({ error: "invalid api key" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad payload", issues: parsed.error.issues }, { status: 400 });
  }
  const e = parsed.data;

  // precisa de pelo menos um identificador
  if (!e.player && !e.account && !e.ip && !e.email) {
    return NextResponse.json({ error: "no identifier" }, { status: 400 });
  }

  let crossAlerts = 0;
  try {
    crossAlerts = await checkCrossServerSeen(
      { serverId: server.id, serverName: server.name, playerName: e.player, account: e.account, ip: e.ip, email: e.email },
      e.type
    );
  } catch {
    /* noop */
  }

  return NextResponse.json({ ok: true, crossAlerts });
}
