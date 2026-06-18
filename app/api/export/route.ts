import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const COLS = ["createdAt", "server", "playerName", "account", "ip", "channel", "score", "reason", "sessionSeconds", "detail"];

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "nao autenticado" }, { status: 401 });
  const admin = me.role === "ADMIN";

  const url = new URL(req.url);
  const format = (url.searchParams.get("format") || "csv").toLowerCase();
  const q = (url.searchParams.get("q") || "").trim();
  const reason = (url.searchParams.get("reason") || "").trim();
  const serverParam = (url.searchParams.get("server") || "").trim();
  let hours = parseInt(url.searchParams.get("hours") || "24", 10);
  if (!Number.isFinite(hours) || hours <= 0) hours = 24;
  if (hours > 720) hours = 720;

  // Scope por tenant: cliente so exporta o seu servidor.
  const effServer = admin ? serverParam : (me.serverId ?? "");
  const where: any = { createdAt: { gte: new Date(Date.now() - hours * 3600 * 1000) } };
  if (effServer) where.serverId = effServer;
  else if (!admin) where.serverId = "__none__";
  if (reason) where.reason = reason;
  if (q)
    where.OR = [
      { playerName: { contains: q, mode: "insensitive" } },
      { account: { contains: q, mode: "insensitive" } },
      { ip: { contains: q } },
    ];

  const rows = await prisma.detection.findMany({ where, orderBy: { createdAt: "desc" }, take: 10000, include: { server: true } });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

  if (format === "json") {
    const data = rows.map((r: any) => ({
      id: r.id.toString(), createdAt: r.createdAt, server: r.server?.name ?? null,
      playerName: r.playerName, account: r.account, ip: r.ip, channel: r.channel,
      score: r.score, reason: r.reason, sessionSeconds: r.sessionSeconds, detail: r.detail,
    }));
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="m2overwatch-detections-${stamp}.json"` },
    });
  }

  const lines = [COLS.join(",")];
  for (const r of rows) {
    lines.push([
      csvCell(r.createdAt.toISOString()), csvCell(r.server?.name ?? ""), csvCell(r.playerName),
      csvCell(r.account), csvCell(r.ip), csvCell(r.channel), csvCell(r.score),
      csvCell(r.reason), csvCell(r.sessionSeconds), csvCell(r.detail),
    ].join(","));
  }
  return new NextResponse("﻿" + lines.join("\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="m2overwatch-detections-${stamp}.csv"` },
  });
}
