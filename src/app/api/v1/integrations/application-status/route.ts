import { NextRequest, NextResponse } from "next/server";
import { rateLimitOrNull } from "@/lib/rate-limit-http";
import { mockApplicationStatus } from "@/lib/mock-integrations";

const RATE_LIMIT = { limit: 20, windowMs: 60_000 };

export async function GET(req: NextRequest) {
  const limited = rateLimitOrNull(req, "integrations-application-status", RATE_LIMIT);
  if (limited) return limited;
  const ref = req.nextUrl.searchParams.get("applicationRef");
  if (!ref) return NextResponse.json({ error: "applicationRef query param is required" }, { status: 400 });
  return NextResponse.json(mockApplicationStatus(ref));
}
