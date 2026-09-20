import { NextRequest, NextResponse } from "next/server";
import { sql, desc, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { queryLogs, feedback, complaints, escalations } from "@/db/schema";
import { isAdminRequest } from "@/lib/admin-auth";

/**
 * Admin dashboard aggregate stats: query volume, low-confidence gaps,
 * feedback ratio, complaint/escalation counts. Read-only aggregation over
 * existing tables — no new tracking added beyond what query-pipeline.ts
 * already logs.
 */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [volumeRows, confidenceRows, outcomeRows, feedbackTotalRows, feedbackByReasonRows, complaintCountRows, escalationCountRows, lowConfidenceQueries] =
    await Promise.all([
      db
        .select({ day: sql<string>`date_trunc('day', ${queryLogs.createdAt})::date::text`, count: sql<number>`count(*)::int` })
        .from(queryLogs)
        .where(gte(queryLogs.createdAt, since))
        .groupBy(sql`1`)
        .orderBy(sql`1`),
      db
        .select({ confidence: queryLogs.confidence, count: sql<number>`count(*)::int` })
        .from(queryLogs)
        .where(gte(queryLogs.createdAt, since))
        .groupBy(queryLogs.confidence),
      db
        .select({ outcome: queryLogs.outcome, count: sql<number>`count(*)::int` })
        .from(queryLogs)
        .where(gte(queryLogs.createdAt, since))
        .groupBy(queryLogs.outcome),
      db.select({ count: sql<number>`count(*)::int` }).from(feedback),
      db.select({ reason: feedback.reason, count: sql<number>`count(*)::int` }).from(feedback).groupBy(feedback.reason),
      db.select({ count: sql<number>`count(*)::int` }).from(complaints),
      db.select({ count: sql<number>`count(*)::int` }).from(escalations),
      db.query.queryLogs.findMany({
        where: sql`${queryLogs.confidence} in ('low', 'none')`,
        orderBy: desc(queryLogs.createdAt),
        limit: 25,
      }),
    ]);

  return NextResponse.json({
    windowDays: 30,
    queryVolumeByDay: volumeRows,
    confidenceBreakdown: confidenceRows,
    outcomeBreakdown: outcomeRows,
    feedback: { total: feedbackTotalRows[0]?.count ?? 0, byReason: feedbackByReasonRows },
    complaintsTotal: complaintCountRows[0]?.count ?? 0,
    escalationsTotal: escalationCountRows[0]?.count ?? 0,
    lowConfidenceGaps: lowConfidenceQueries.map((q) => ({
      id: q.id,
      query: q.query,
      confidence: q.confidence,
      outcome: q.outcome,
      createdAt: q.createdAt,
    })),
  });
}
