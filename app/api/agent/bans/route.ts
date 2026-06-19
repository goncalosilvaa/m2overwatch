import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// O agente do servidor pede aqui os bans pendentes de execucao (auth por x-api-key).
export async function GET(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return NextResponse.json({ error: "missing api key" }, { status: 401 });

  const server = await prisma.server.findUnique({ where: { apiKey } });
  if (!server || !server.active) {
    return NextResponse.json({ error: "invalid api key" }, { status: 401 });
  }

  const bans = await prisma.ban.findMany({
    where: { serverId: server.id, executeInGame: true, executed: false },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, playerName: true, account: true, ip: true, reason: true },
  });

  return NextResponse.json({ bans });
}
