import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// O agente confirma aqui que aplicou (ou nao) um ban no jogo.
export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return NextResponse.json({ error: "missing api key" }, { status: 401 });

  const server = await prisma.server.findUnique({ where: { apiKey } });
  if (!server || !server.active) {
    return NextResponse.json({ error: "invalid api key" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { id?: string; ok?: boolean; error?: string } | null;
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const ban = await prisma.ban.findUnique({ where: { id } });
  if (!ban || ban.serverId !== server.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.ban.update({
    where: { id },
    data: {
      executed: true,
      executedAt: new Date(),
      executeError: body?.ok ? null : body?.error || "erro desconhecido",
    },
  });

  return NextResponse.json({ ok: true });
}
