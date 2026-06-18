import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");
export const SESSION_COOKIE = "m2ow_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

// Opcoes do cookie de sessao (usadas ao defini-lo na RESPOSTA do route handler).
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

export type SessionPayload = {
  uid?: string;
  email?: string;
  role?: string;
  serverId?: string | null;
  serverName?: string | null;
};

// Assina e DEVOLVE o token (nao escreve cookie). O route handler define-o na resposta.
export async function signSession(p: {
  uid: string;
  email: string;
  role: string;
  serverId: string | null;
  serverName: string | null;
}): Promise<string> {
  return new SignJWT({
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

  if (s.role) {
    return {
      id: s.uid ?? "",
      email: s.email,
      role: s.role,
      serverId: s.serverId ?? null,
      server: s.serverName ? { id: s.serverId ?? "", name: s.serverName } : null,
    };
  }

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
