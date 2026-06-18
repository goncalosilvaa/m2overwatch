import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: unknown; password?: unknown };
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "").trim();
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Credenciais invalidas" }, { status: 401 });
  }

  try {
    let user = await prisma.user.findUnique({ where: { email } });

    // Bootstrap: se a DB ainda nao tem utilizadores, cria o admin a partir do .env.
    if (!user) {
      const adminEmail = String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
      const adminPass = String(process.env.ADMIN_PASSWORD ?? "").trim();
      const count = await prisma.user.count();
      if (count === 0 && adminEmail && email === adminEmail && password === adminPass) {
        user = await prisma.user.create({
          data: { email, passwordHash: hashPassword(password), role: "ADMIN" },
        });
      }
    }

    if (user && verifyPassword(password, user.passwordHash)) {
      await createSession(user.email);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: "Credenciais invalidas" }, { status: 401 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Erro de ligacao a DB. Confirma o DATABASE_URL e corre 'npm run db:push'." },
      { status: 500 }
    );
  }
}
