import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitOrNull } from "@/lib/rate-limit-http";
import { mockCreatePaymentOrder, mockVerifyPayment } from "@/lib/mock-integrations";

const RATE_LIMIT = { limit: 20, windowMs: 60_000 };
const CreateSchema = z.object({ action: z.literal("create"), amountInPaise: z.number().int().positive(), purpose: z.string().min(1).max(200) });
const VerifySchema = z.object({ action: z.literal("verify"), orderId: z.string().min(1).max(100) });
const Schema = z.discriminatedUnion("action", [CreateSchema, VerifySchema]);

export async function POST(req: NextRequest) {
  const limited = rateLimitOrNull(req, "integrations-payment", RATE_LIMIT);
  if (limited) return limited;
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.action === "create") {
    return NextResponse.json(mockCreatePaymentOrder(parsed.data.amountInPaise, parsed.data.purpose));
  }
  return NextResponse.json(mockVerifyPayment(parsed.data.orderId));
}
