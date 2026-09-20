"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { PageBanner } from "@/components/layout/PageBanner";
import { Footer } from "@/components/layout/Footer";
import { EvidenceExcerpt } from "@/components/evidence/EvidenceExcerpt";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { LoadingIndicator } from "@/components/query/LoadingIndicator";
import { VoiceInputButton } from "@/components/query/VoiceInputButton";
import type { SearchResponse } from "@/types/api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/v1/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text.trim() }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setResult(await res.json());
    } catch {
      setError("We couldn't retrieve relevant BIS sources.");
    } finally {
      setLoading(false);
    }
  }

  // Standard-number-looking queries (e.g. "IS 5522") deserve a slightly
  // different empty-state hint than a description-style query.
  const looksLikeStandardNumber = /^IS[\s-]?\d/i.test(query.trim());

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="flex-1">
        <PageBanner
          width="max-w-3xl"
          crumbs={[{ label: "Search" }]}
          title="Search Indian Standards"
          description="Search directly by product, standard number, or topic across the ingested BIS document corpus. This is keyword and semantic retrieval only — no generated answer."
        />
        <div className="mx-auto max-w-3xl px-4 pb-14 pt-8 sm:px-6">

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(query);
            }}
            className="mt-6 flex flex-col gap-2 sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-1 rounded-md border border-border-strong bg-surface-raised pr-1.5 focus-within:border-navy">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. IS 5522, stainless steel utensils, packaged drinking water…"
                aria-label="Search Indian Standards"
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-ink outline-none"
              />
              <VoiceInputButton
                onResult={(transcript) => {
                  setQuery(transcript);
                  runSearch(transcript);
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full rounded-sm bg-navy-solid px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-deep disabled:opacity-40 sm:w-auto"
            >
              Search
            </button>
          </form>

          <div className="mt-8 space-y-3">
            {loading && <LoadingIndicator />}
            {error && <ErrorState title="Search failed" body={error} />}

            {result && result.results.length === 0 && (
              <EmptyState
                title="No matching standards found"
                body="No chunks in the current knowledge base matched this query."
                tips={
                  looksLikeStandardNumber
                    ? ["Check the standard number format, e.g. \"IS 5522\".", "Try a keyword from the title instead."]
                    : ["Try a more specific product or material name.", "Try the exact standard number if you know it."]
                }
              />
            )}

            {result?.results.map((r) => (
              <EvidenceExcerpt
                key={r.chunkId}
                standardNumber={r.standardNumber}
                documentTitle={r.title}
                section={r.section}
                clause={r.clause}
                page={r.page}
                text={r.text}
                sourceUrl={r.sourceUrl}
                standardHref={`/standards/${r.documentId}`}
              />
            ))}
          </div>

          <p className="mt-10 text-xs text-ink-faint">
            Looking for an evidence-backed answer instead of raw search results?{" "}
            <Link href="/" className="text-navy hover:underline">
              Describe your product on the home page.
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
