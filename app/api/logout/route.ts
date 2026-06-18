import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

export async function GET(req: Request) {
  clearSession();
  return NextResponse.redirect(new URL("/login", req.url));
}
