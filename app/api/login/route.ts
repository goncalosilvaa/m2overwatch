import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

// Login por submissao de FORMULARIO (navegacao top-level), nao por fetch.
// O cookie segue num redirect 303 -> o browser guarda-o de forma fiavel.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const email = String(form?.get("email") ?? "").trim().toLowerCase();
  const password = String(form?.get("password") ?? "").trim();
  const fail = (code: string) => NextResponse.redirect(new URL(`/login?e=${code}`, req.url), 303);

  if (!email || !password) return fail("1");

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
      const res = NextResponse.redirect(new URL("/dashboard", req.url), 303);
      res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
      return res;
    }
    return fail("1");
  } catch {
    return fail("2");
  }
}
