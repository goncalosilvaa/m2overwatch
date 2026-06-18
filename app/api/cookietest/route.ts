import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Teste neutro: define um cookie simples (sem login, sem DB).
// Depois de abrir isto, abre /api/whoami e ve se "testCookiePresent" e true.
export async function GET() {
  const res = NextResponse.json({ ok: true, note: "agora abre /api/whoami" });
  res.cookies.set("m2ow_test", "hello", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 3600,
  });
  return res;
}
