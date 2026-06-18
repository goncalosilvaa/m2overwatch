import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");
export const SESSION_COOKIE = "m2ow_session";

export type SessionPayload = {
  uid?: string;
  email?: string;
  role?: string;
  serverId?: string | null;
  serverName?: string | null;
};

// O token leva papel + servidor assinados, para a auth nao depender da DB.
export async function createSession(p: {
  uid: string;
  email: string;
  role: string;
  serverId: string | null;
  serverName: string | null;
}) {
  const token = await new SignJWT({
    uid: p.uid,
    email: p.email,
    role: p.role,
    serverId: p.serverId,
    serverName: p.serverName,
  })
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

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionPayload;
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

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const s = await getSession();
  if (!s?.email) return null;

  // Token novo: papel/servidor vem do token -> sem ida a DB (imune a falhas
  // transitorias da DB, que antes causavam logout indevido na navegacao).
  if (s.role) {
    return {
      id: s.uid ?? "",
      email: s.email,
      role: s.role,
      serverId: s.serverId ?? null,
      server: s.serverName ? { id: s.serverId ?? "", name: s.serverName } : null,
    };
  }

  // Token antigo (so email, de antes desta versao): enriquece via DB uma vez.
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
