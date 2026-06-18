import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "").trim();
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Credenciais invalidas" }, { status: 401 });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email },
      include: { server: { select: { id: true, name: true } } },
    });

    if (!user) {
      const adminEmail = String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
      const adminPass = String(process.env.ADMIN_PASSWORD ?? "").trim();
      const count = await prisma.user.count();
      if (count === 0 && adminEmail && email === adminEmail && password === adminPass) {
        const created = await prisma.user.create({
          data: { email, passwordHash: hashPassword(password), role: "ADMIN" },
        });
        user = { ...created, server: null } as any;
      }
    }

    if (user && verifyPassword(password, user.passwordHash)) {
      const token = await signSession({
        uid: user.id,
        email: user.email,
        role: user.role,
        serverId: user.serverId ?? null,
        serverName: user.server?.name ?? null,
      });
      // Define o cookie DIRETAMENTE na resposta (garante o Set-Cookie na Vercel).
      const res = NextResponse.json({ ok: true });
      res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
      return res;
    }
    return NextResponse.json({ ok: false, error: "Credenciais invalidas" }, { status: 401 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro de ligacao a DB. Confirma o DATABASE_URL e corre 'npm run db:push'." },
      { status: 500 }
    );
  }
}
