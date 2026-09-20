import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

/**
 * Admin authentication for the internal ops dashboard (/admin, /api/v1/admin/*).
 *
 * Stateless by design — this app runs on Next.js/Vercel with no
 * single-instance in-memory store to trust across requests (same reasoning
 * as rate-limit-http.ts). The session is a signed cookie, not a DB row:
 *   cookie = base64url(payload) + "." + base64url(hmacSha256(payload))
 * `payload` is just an issue timestamp — there's exactly one admin
 * account, so there is nothing else to encode.
 *
 * Password is never stored in plaintext: ADMIN_PASSWORD_HASH in the
 * environment is a scrypt hash (`npm run admin:hash-password` — see
 * scripts/admin-hash-password.ts) in the form "salt:hash", both hex.
 */

const COOKIE_NAME = "bis_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12h

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not set. Generate one (e.g. `openssl rand -hex 32`) and add it to .env.local.",
    );
  }
  return secret;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionCookieValue(): string {
  const payload = Buffer.from(String(Date.now())).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function isSessionValid(cookieValue: string | undefined | null): boolean {
  if (!cookieValue) return false;
  const [payload, sig] = cookieValue.split(".");
  if (!payload || !sig) return false;
  const expectedSig = sign(payload);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return false;
  const issuedAt = Number(Buffer.from(payload, "base64url").toString());
  if (!Number.isFinite(issuedAt)) return false;
  return Date.now() - issuedAt < SESSION_TTL_MS;
}

export function isAdminRequest(req: NextRequest): boolean {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  return isSessionValid(cookie);
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;
export const ADMIN_COOKIE_MAX_AGE_S = Math.floor(SESSION_TTL_MS / 1000);

/** Constant-time-ish compare of a submitted username to the configured one — not security-critical (username isn't a secret) but kept consistent with the rest of this module. */
export function isCorrectAdminUsername(username: string): boolean {
  const expected = process.env.ADMIN_USERNAME ?? "admin";
  const a = createHash("sha256").update(username).digest();
  const b = createHash("sha256").update(expected).digest();
  return a.length === b.length && timingSafeEqual(a, b);
}
