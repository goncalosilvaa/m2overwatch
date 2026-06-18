import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { SESSION_COOKIE, getSession, getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const raw = cookies().get(SESSION_COOKIE)?.value || null;
  const test = cookies().get("m2ow_test")?.value || null;
  const host = headers().get("host") || null;
  const session = await getSession();
  let currentUser: any = null;
  let userError: string | null = null;
  try {
    currentUser = await getCurrentUser();
  } catch (e: any) {
    userError = e?.message || String(e);
  }
  return NextResponse.json({
    marker: "whoami-v5",
    host, // <-- em que dominio estas (producao vs preview com hash)
    testCookiePresent: !!test,
    rawCookiePresent: !!raw,
    hasValidSession: !!session,
    session,
    currentUser,
    userError,
    env: {
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV || null,
    },
  });
}
