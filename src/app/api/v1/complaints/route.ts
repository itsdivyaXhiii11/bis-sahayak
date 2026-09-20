import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { complaints } from "@/db/schema";
import { rateLimitOrNull } from "@/lib/rate-limit-http";
import { PROTOTYPE_NOTICE, PROTOTYPE_FLAG } from "@/lib/prototype-notice";
import { CONTACT_CHANNELS } from "@/lib/official-links";

/**
 * Citizen complaint filing — PROTOTYPE ONLY. See src/lib/prototype-notice.ts
 * and src/db/schema.ts's comment above `complaints`: nothing submitted here
 * reaches BIS. Ported from A's complaint-filing flow, but every response
 * carries the prototype notice and the real BIS channels, which A's did not.
 */

const CATEGORIES = ["mislabeled_product", "counterfeit_isi_mark", "app_issue", "other"] as const;

const CreateSchema = z.object({
  sessionId: z.string().min(1).max(200),
  category: z.enum(CATEGORIES),
  description: z.string().min(10).max(4000),
  contactInfo: z.string().max(500).optional(),
  standardNumber: z.string().max(50).optional(),
});

const RATE_LIMIT = { limit: 10, windowMs: 60_000 };

function generateReferenceId(): string {
  const year = new Date().getFullYear();
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `CMP-${year}-${rand}`;
}

export async function POST(req: NextRequest) {
  const limited = rateLimitOrNull(req, "complaints-create", RATE_LIMIT);
  if (limited) return limited;

  const parsed = CreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const referenceId = generateReferenceId();
  const [row] = await db
    .insert(complaints)
    .values({ referenceId, ...parsed.data })
    .returning();

  return NextResponse.json({
    ...PROTOTYPE_FLAG,
    notice: PROTOTYPE_NOTICE,
    referenceId: row.referenceId,
    status: row.status,
    createdAt: row.createdAt,
    officialChannels: CONTACT_CHANNELS,
  });
}

export async function GET(req: NextRequest) {
  const limited = rateLimitOrNull(req, "complaints-lookup", RATE_LIMIT);
  if (limited) return limited;

  const referenceId = req.nextUrl.searchParams.get("referenceId");
  if (!referenceId) {
    return NextResponse.json({ error: "referenceId query param is required" }, { status: 400 });
  }

  const db = getDb();
  const row = await db.query.complaints.findFirst({ where: eq(complaints.referenceId, referenceId) });
  if (!row) {
    return NextResponse.json({ error: "No complaint found with that reference ID" }, { status: 404 });
  }

  return NextResponse.json({
    ...PROTOTYPE_FLAG,
    notice: PROTOTYPE_NOTICE,
    referenceId: row.referenceId,
    category: row.category,
    status: row.status,
    createdAt: row.createdAt,
  });
}
