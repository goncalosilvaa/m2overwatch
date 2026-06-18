import { NextResponse } from "next/server";
import { getSession, getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Endpoint de diagnostico (sem segredos). Visita /api/whoami depois de fazeres login.
export async function GET() {
  const session = await getSession();
  let currentUser: any = null;
  let userError: string | null = null;
  try {
    currentUser = await getCurrentUser();
  } catch (e: any) {
    userError = e?.message || String(e);
  }
  return NextResponse.json({
    marker: "whoami-v2",
    hasSessionCookie: !!session,
    session, // payload do token: email, role, serverId, serverName (sem password)
    currentUser,
    userError,
    env: {
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV || null,
    },
  });
}
