import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { rateLimitOrNull } from "@/lib/rate-limit-http";

/** Per-session notification feed, polled from the UI's bell icon. Session-scoped only — `sessionId` is a client-generated opaque string (see NotificationBell.tsx), not an authenticated account, so this is not a substitute for real per-user auth. */

const RATE_LIMIT = { limit: 30, windowMs: 60_000 };

const MarkReadSchema = z.object({
  sessionId: z.string().min(1).max(200),
  id: z.string().uuid().optional(), // omit to mark all read for this session
});

export async function GET(req: NextRequest) {
  const limited = rateLimitOrNull(req, "notifications-list", RATE_LIMIT);
  if (limited) return limited;

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId query param is required" }, { status: 400 });
  }

  const db = getDb();
  const rows = await db.query.notifications.findMany({
    where: eq(notifications.sessionId, sessionId),
    orderBy: desc(notifications.createdAt),
    limit: 50,
  });

  return NextResponse.json({
    notifications: rows,
    unreadCount: rows.filter((r) => !r.read).length,
  });
}

export async function POST(req: NextRequest) {
  const limited = rateLimitOrNull(req, "notifications-mark-read", RATE_LIMIT);
  if (limited) return limited;

  const parsed = MarkReadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const { sessionId, id } = parsed.data;
  if (id) {
    await db.update(notifications).set({ read: true }).where(and(eq(notifications.id, id), eq(notifications.sessionId, sessionId)));
  } else {
    await db.update(notifications).set({ read: true }).where(eq(notifications.sessionId, sessionId));
  }

  return NextResponse.json({ ok: true });
}
