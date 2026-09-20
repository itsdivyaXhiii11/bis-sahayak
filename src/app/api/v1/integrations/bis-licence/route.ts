import { NextRequest, NextResponse } from "next/server";
import { rateLimitOrNull } from "@/lib/rate-limit-http";
import { mockBisLicenceLookup } from "@/lib/mock-integrations";

const RATE_LIMIT = { limit: 20, windowMs: 60_000 };

export async function GET(req: NextRequest) {
  const limited = rateLimitOrNull(req, "integrations-bis-licence", RATE_LIMIT);
  if (limited) return limited;
  const licenceId = req.nextUrl.searchParams.get("licenceId");
  if (!licenceId) return NextResponse.json({ error: "licenceId query param is required" }, { status: 400 });
  return NextResponse.json(mockBisLicenceLookup(licenceId));
}
