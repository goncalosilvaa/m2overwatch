import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Endpoint de INGESTÃO: o agente (watcher) / DLL / servidor faz POST aqui.
// Autenticação por header `x-api-key` (a key de cada servidor cliente).
export const dynamic = "force-dynamic";

const schema = z.object({
  player: z.string().min(1).max(64),
  account: z.string().max(64).optional(),
  ip: z.string().max(64).optional(),
  channel: z.string().max(64).optional(),
  score: z.number().optional().default(0),
  reason: z.string().min(1).max(64),
  detail: z.string().max(512).optional(),
  sessionSeconds: z.number().int().min(0).optional().default(0),
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
  const d = parsed.data;

  await prisma.detection.create({
    data: {
      serverId: server.id,
      playerName: d.player,
      account: d.account,
      ip: d.ip,
      channel: d.channel,
      score: d.score,
      reason: d.reason,
      detail: d.detail,
      sessionSeconds: d.sessionSeconds,
    },
  });

  return NextResponse.json({ ok: true });
}
