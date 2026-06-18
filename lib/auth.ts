import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");
export const SESSION_COOKIE = "m2ow_session";

export async function createSession(email: string) {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSession() {
  cookies().set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function getSession(): Promise<{ email?: string } | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { email?: string };
  } catch {
    return null;
  }
}

export type CurrentUser = {
  id: string;
  email: string;
  role: string;
  serverId: string | null;
  server: { id: string; name: string } | null;
};

// Carrega o utilizador autenticado a partir da DB (papel + servidor atribuido).
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const s = await getSession();
  if (!s?.email) return null;
  try {
    const u = await prisma.user.findUnique({
      where: { email: s.email },
      include: { server: { select: { id: true, name: true } } },
    });
    if (!u) return null;
    return { id: u.id, email: u.email, role: u.role, serverId: u.serverId, server: u.server };
  } catch {
    return null;
  }
}

export function userIsAdmin(u: { role?: string } | null | undefined): boolean {
  return u?.role === "ADMIN";
}
