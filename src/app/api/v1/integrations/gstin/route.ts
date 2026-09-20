import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitOrNull } from "@/lib/rate-limit-http";
import { mockGstinVerify } from "@/lib/mock-integrations";

const RATE_LIMIT = { limit: 20, windowMs: 60_000 };
const Schema = z.object({ gstin: z.string().min(1).max(20) });

export async function POST(req: NextRequest) {
  const limited = rateLimitOrNull(req, "integrations-gstin", RATE_LIMIT);
  if (limited) return limited;
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  return NextResponse.json(mockGstinVerify(parsed.data.gstin));
}
