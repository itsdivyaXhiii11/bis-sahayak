import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { getDb } from "@/db";
import { escalations, notifications } from "@/db/schema";
import { rateLimitOrNull } from "@/lib/rate-limit-http";
import { PROTOTYPE_NOTICE, PROTOTYPE_FLAG } from "@/lib/prototype-notice";
import { CONTACT_CHANNELS } from "@/lib/official-links";

/**
 * Escalation to a human officer — PROTOTYPE ONLY, same caveat as
 * /api/v1/complaints. Distinct from a complaint: this is "the assistant
 * couldn't resolve my question, I want a person," not "I'm reporting a
 * violation." Recorded here and immediately surfaced back to the same
 * session as a notification, since there is no real officer queue behind
 * this endpoint to route to.
 */

const CreateSchema = z.object({
  sessionId: z.string().min(1).max(200),
  reason: z.string().min(5).max(2000),
  contactInfo: z.string().max(500).optional(),
  queryLogId: z.string().uuid().optional(),
});

const RATE_LIMIT = { limit: 10, windowMs: 60_000 };

function generateReferenceId(): string {
  const year = new Date().getFullYear();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `ESC-${year}-${rand}`;
}

export async function POST(req: NextRequest) {
  const limited = rateLimitOrNull(req, "escalate-create", RATE_LIMIT);
  if (limited) return limited;

  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const referenceId = generateReferenceId();
  const [row] = await db
    .insert(escalations)
    .values({ referenceId, ...parsed.data })
    .returning();

  await db.insert(notifications).values({
    sessionId: parsed.data.sessionId,
    kind: "escalation_update",
    message: `Your request for a human officer (${referenceId}) has been recorded. ${PROTOTYPE_NOTICE}`,
    relatedReferenceId: referenceId,
  });

  return NextResponse.json({
    ...PROTOTYPE_FLAG,
    notice: PROTOTYPE_NOTICE,
    referenceId: row.referenceId,
    status: row.status,
    createdAt: row.createdAt,
    officialChannels: CONTACT_CHANNELS,
  });
}
