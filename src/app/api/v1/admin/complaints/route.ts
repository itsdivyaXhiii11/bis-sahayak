import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { complaints } from "@/db/schema";
import { isAdminRequest } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  const rows = await db.query.complaints.findMany({ orderBy: desc(complaints.createdAt), limit: 100 });
  return NextResponse.json({ complaints: rows });
}
