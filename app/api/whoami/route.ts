import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, getSession, getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const raw = cookies().get(SESSION_COOKIE)?.value || null;
  const test = cookies().get("m2ow_test")?.value || null;
  const session = await getSession();
  let currentUser: any = null;
  let userError: string | null = null;
  try {
    currentUser = await getCurrentUser();
  } catch (e: any) {
    userError = e?.message || String(e);
  }
  return NextResponse.json({
    marker: "whoami-v4",
    testCookiePresent: !!test, // <-- cookie neutro (de /api/cookietest)
    rawCookiePresent: !!raw, // <-- cookie de sessao
    rawCookieLen: raw ? raw.length : 0,
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
