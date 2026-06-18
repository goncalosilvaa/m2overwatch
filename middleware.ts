import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

// Protege as paginas do painel. /api/ingest (api-key) e /api/export (verifica sessao
// internamente) ficam de fora do matcher.
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("m2ow_session")?.value;
  let ok = false;
  if (token) {
    try {
      await jwtVerify(token, secret);
      ok = true;
    } catch {
      ok = false;
    }
  }
  if (!ok) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/servers/:path*",
    "/bans/:path*",
    "/lists/:path*",
    "/analytics/:path*",
  ],
};
