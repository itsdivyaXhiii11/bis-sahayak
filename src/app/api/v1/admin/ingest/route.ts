import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
// See analyze-document/route.ts's comment on why this imports the internal
// lib path directly rather than "pdf-parse" — same Turbopack-safe pattern.
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { embedMany } from "ai";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { documents, chunks } from "@/db/schema";
import { chunkDocument } from "@/lib/chunk";
import { embeddingModel } from "@/lib/embedding-provider";
import { rateLimitOrNull } from "@/lib/rate-limit-http";
import { isAdminRequest } from "@/lib/admin-auth";

/**
 * Live, in-app standards-document ingestion (admin-only) — the same
 * chunk-and-embed pipeline scripts/ingest.ts runs offline against the
 * seed manifest, exposed here as an upload endpoint so a new PDF can be
 * merged into the retrieval index without a redeploy or CLI access.
 * Deliberately admin-gated: this writes directly into the corpus other
 * routes treat as authoritative, so it carries the same "no unreviewed
 * write path into evidence" concern as scripts/ingest.ts already has,
 * just enforced by a login instead of shell access.
 */

const MAX_FILE_BYTES = 25 * 1024 * 1024; // matches scripts/ingest.ts's batch ceiling, not analyze-document's tighter one
const RATE_LIMIT = { limit: 5, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limited = rateLimitOrNull(req, "admin-ingest", RATE_LIMIT);
  if (limited) return limited;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  const standardNumber = String(form.get("standardNumber") ?? "").trim();
  const title = String(form.get("title") ?? "").trim();
  const sourceUrl = String(form.get("sourceUrl") ?? "").trim();

  if (!(file instanceof File)) return NextResponse.json({ error: "Missing 'file' field" }, { status: 400 });
  if (!standardNumber || !title || !sourceUrl) {
    return NextResponse.json({ error: "standardNumber, title, and sourceUrl are required" }, { status: 400 });
  }
  if (file.size === 0) return NextResponse.json({ error: "Uploaded file is empty" }, { status: 400 });
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: `File exceeds the ${MAX_FILE_BYTES} byte limit` }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const isPdf = buf.subarray(0, 5).toString("ascii") === "%PDF-";
  let rawText: string;
  if (isPdf) {
    try {
      const parsed = await pdfParse(buf);
      rawText = parsed.text;
    } catch (err) {
      return NextResponse.json({ error: "Failed to parse PDF", details: err instanceof Error ? err.message : String(err) }, { status: 422 });
    }
  } else {
    rawText = buf.toString("utf-8");
  }

  if (!rawText || rawText.trim().length < 50) {
    return NextResponse.json({ error: "Could not extract meaningful text from the uploaded file" }, { status: 422 });
  }

  const checksum = createHash("sha256").update(rawText).digest("hex");
  const db = getDb();

  const existing = await db.query.documents.findFirst({
    where: eq(documents.standardNumber, standardNumber),
    with: { chunks: { columns: { id: true }, limit: 1 } },
  });
  if (existing && existing.checksum === checksum && existing.chunks.length > 0) {
    return NextResponse.json({ status: "unchanged", standardNumber, message: "Identical content already indexed." });
  }
  if (existing) {
    await db.delete(documents).where(eq(documents.id, existing.id)); // cascades to chunks
  }

  const [doc] = await db
    .insert(documents)
    .values({
      standardNumber,
      title,
      documentType: "standard",
      sourceUrl,
      sourceOrg: "BIS",
      retrievedAt: new Date(),
      checksum,
    })
    .returning();

  const structured = chunkDocument(rawText);
  if (structured.length === 0) {
    return NextResponse.json({ error: "No usable chunks could be extracted from this document" }, { status: 422 });
  }

  let embeddings: number[][];
  try {
    const result = await embedMany({ model: embeddingModel(), values: structured.map((c) => c.text) });
    embeddings = result.embeddings;
  } catch (err) {
    // Roll back the document row so a failed embedding step doesn't leave
    // an unsearchable document sitting in the corpus.
    await db.delete(documents).where(eq(documents.id, doc.id));
    return NextResponse.json({ error: "Embedding step failed — no changes were made to the index", details: err instanceof Error ? err.message : String(err) }, { status: 502 });
  }

  await db.insert(chunks).values(
    structured.map((c, idx) => ({
      documentId: doc.id,
      section: c.section,
      clause: c.clause,
      page: c.page,
      text: c.text,
      embedding: embeddings[idx],
      metadata: { standardNumber },
    })),
  );

  return NextResponse.json({
    status: "indexed",
    standardNumber,
    documentId: doc.id,
    chunksIndexed: structured.length,
    message: "Merged into the live retrieval index — no restart required.",
  });
}
