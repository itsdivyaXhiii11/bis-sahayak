import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { runQueryPipeline } from "@/lib/query-pipeline";
import { rateLimitOrNull } from "@/lib/rate-limit-http";

/**
 * Image-query flow: photo upload -> vision description -> the same
 * compliance-journey pipeline /api/v1/analyze-product uses. Deliberately
 * NOT a second, parallel engine — same reasoning as analyze-product's own
 * comment. The only new piece here is turning a photo into a text
 * description; everything after that is the existing, evidence-grounded
 * query pipeline.
 *
 * Requires a configured vision-capable provider (Gemini). With none
 * configured, this returns a clear 503 rather than fabricating a
 * plausible-sounding product description — same "deterministic or
 * explicit refusal, never a guess dressed up as an answer" rule the rest
 * of this app follows (docs/ARCHITECTURE.md).
 */

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const RATE_LIMIT = { limit: 10, windowMs: 60_000 };

function isVisionConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

export async function POST(req: NextRequest) {
  const limited = rateLimitOrNull(req, "image-query", RATE_LIMIT);
  if (limited) return limited;

  if (!isVisionConfigured()) {
    return NextResponse.json(
      {
        error: "Image analysis is not configured on this deployment (no GEMINI_API_KEY/GOOGLE_GENERATIVE_AI_API_KEY set).",
        fallback: "Describe the product in words instead, using /api/v1/analyze-product.",
      },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data with an 'image' field" }, { status: 400 });
  }

  const file = form.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "Missing 'image' field" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "Uploaded image is empty" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: `Image exceeds the ${MAX_FILE_BYTES} byte limit` }, { status: 413 });
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type — use JPEG, PNG, or WebP" }, { status: 415 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY!;
  const model = createGoogleGenerativeAI({ apiKey })(process.env.GEMINI_MODEL ?? "gemini-3.6-flash");

  let description: string;
  try {
    const result = await generateText({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Describe this product for the purpose of identifying which Indian Standard (BIS) it might fall under. " +
                "State only what is visibly true: the product type, apparent material(s), and any visible markings or " +
                "labels (read them exactly, do not guess at illegible text). One or two plain sentences, no speculation " +
                "about brand, price, or anything not visible in the image.",
            },
            { type: "image", image: buf, mediaType: file.type || "image/jpeg" },
          ],
        },
      ],
      maxOutputTokens: 200,
    });
    description = result.text.trim();
  } catch (err) {
    return NextResponse.json({ error: "Image analysis failed", details: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }

  if (!description) {
    return NextResponse.json({ error: "Could not extract a usable description from the image" }, { status: 422 });
  }

  const result = await runQueryPipeline(description);
  return NextResponse.json({
    imageDescription: description,
    imageDescriptionSource: "gemini-vision",
    ...result,
  });
}
