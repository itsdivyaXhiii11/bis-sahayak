import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitOrNull } from "@/lib/rate-limit-http";
import { verifyPassword, isCorrectAdminUsername, createSessionCookieValue, ADMIN_COOKIE_NAME, ADMIN_COOKIE_MAX_AGE_S } from "@/lib/admin-auth";

const Schema = z.object({ username: z.string().min(1).max(100), password: z.string().min(1).max(500) });
const RATE_LIMIT = { limit: 10, windowMs: 60_000 }; // deliberately tight — this is a login endpoint

export async function POST(req: NextRequest) {
  const limited = rateLimitOrNull(req, "admin-login", RATE_LIMIT);
  if (limited) return limited;

  const storedHash = process.env.ADMIN_PASSWORD_HASH;
  if (!storedHash) {
    return NextResponse.json(
      { error: "Admin login is not configured. Set ADMIN_PASSWORD_HASH (see scripts/admin-hash-password.ts)." },
      { status: 503 },
    );
  }

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { username, password } = parsed.data;
  if (!isCorrectAdminUsername(username) || !verifyPassword(password, storedHash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, createSessionCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_COOKIE_MAX_AGE_S,
    path: "/",
  });
  return res;
}
