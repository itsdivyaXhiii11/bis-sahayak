import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { standards, testingRequirements } from "@/db/schema";
import { rateLimitOrNull } from "@/lib/rate-limit-http";

/**
 * Lab test-capability matching, scored against `testing_requirements` /
 * `laboratory_capabilities` (src/db/schema.ts) — tables that already
 * existed but had no route reading them yet.
 *
 * IMPORTANT — this intentionally does NOT fabricate a match score. The
 * currently-loaded laboratory dataset (src/lib/laboratories.ts, sourced
 * from BIS's own Group-1 recognised-laboratory list) records recognition
 * status and location only; it carries no per-standard testing-capability
 * field (see find-laboratories/route.ts's own comment: "claiming a
 * capability match here would be fabrication"). So until real,
 * source-backed rows are loaded into `laboratory_capabilities` — the same
 * verification-status discipline every other table in this schema
 * requires — this route reports the required tests for a standard
 * honestly and returns zero scored matches with a clear reason, rather
 * than inventing a percentage. It is real, working plumbing for the
 * feature; it needs real data before it will show anything but that
 * notice.
 */

const RequestSchema = z.object({ standardNumber: z.string().min(1).max(50) });
const RATE_LIMIT = { limit: 20, windowMs: 60_000 };

export async function GET(req: NextRequest) {
  const limited = rateLimitOrNull(req, "lab-match", RATE_LIMIT);
  if (limited) return limited;

  const parsed = RequestSchema.safeParse({ standardNumber: req.nextUrl.searchParams.get("standardNumber") });
  if (!parsed.success) {
    return NextResponse.json({ error: "standardNumber query param is required" }, { status: 400 });
  }

  const db = getDb();
  const standard = await db.query.standards.findFirst({ where: eq(standards.canonicalNumber, parsed.data.standardNumber) });
  if (!standard) {
    return NextResponse.json({ error: `No standard found matching "${parsed.data.standardNumber}"` }, { status: 404 });
  }

  const requiredTests = await db.query.testingRequirements.findMany({ where: eq(testingRequirements.standardId, standard.id) });

  if (requiredTests.length === 0) {
    return NextResponse.json({
      standardNumber: standard.canonicalNumber,
      requiredTests: [],
      matches: [],
      message: "No verified testing requirements are recorded for this standard yet, so no lab match can be computed.",
    });
  }

  const requiredIds = new Set(requiredTests.map((t) => t.id));
  const capabilityRows = await db.query.laboratoryCapabilities.findMany({
    where: (lc, { inArray }) => inArray(lc.testingRequirementId, [...requiredIds]),
  });

  if (capabilityRows.length === 0) {
    return NextResponse.json({
      standardNumber: standard.canonicalNumber,
      requiredTests: requiredTests.map((t) => ({ id: t.id, testName: t.testName, clause: t.clause, category: t.category })),
      matches: [],
      message:
        "No laboratory has verified, source-backed capability data on file for these tests yet — this app does not " +
        "estimate or guess a match to avoid pointing you at a lab that may not actually run this test. " +
        "Confirm scope directly with a laboratory from /testing/laboratory-search, or the official BIS testing portal.",
    });
  }

  const byLab = new Map<string, Set<string>>();
  for (const row of capabilityRows) {
    if (!byLab.has(row.laboratoryId)) byLab.set(row.laboratoryId, new Set());
    byLab.get(row.laboratoryId)!.add(row.testingRequirementId);
  }

  const labIds = [...byLab.keys()];
  const labRows = await db.query.laboratories.findMany({ where: (l, { inArray }) => inArray(l.id, labIds) });
  const labById = new Map(labRows.map((l) => [l.id, l]));

  const matches = [...byLab.entries()]
    .map(([labId, covered]) => {
      const lab = labById.get(labId);
      if (!lab) return null;
      return {
        laboratoryId: labId,
        name: lab.name,
        city: lab.city,
        state: lab.state,
        matchedTests: covered.size,
        requiredTests: requiredTests.length,
        matchPercent: Math.round((covered.size / requiredTests.length) * 100),
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => b.matchPercent - a.matchPercent);

  return NextResponse.json({
    standardNumber: standard.canonicalNumber,
    requiredTests: requiredTests.map((t) => ({ id: t.id, testName: t.testName, clause: t.clause, category: t.category })),
    matches,
  });
}
