"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { PageBanner } from "@/components/layout/PageBanner";
import { Footer } from "@/components/layout/Footer";
import { getOrCreateSessionId } from "@/lib/client/session-id";
import { CONTACT_CHANNELS } from "@/lib/official-links";

const CATEGORIES = [
  { value: "mislabeled_product", label: "Mislabeled product" },
  { value: "counterfeit_isi_mark", label: "Counterfeit ISI/hallmark" },
  { value: "app_issue", label: "Issue with this assistant" },
  { value: "other", label: "Other" },
] as const;

export default function ComplaintsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="flex-1">
        <PageBanner
          width="max-w-[860px]"
          crumbs={[{ label: "Complaints & Escalation" }]}
          title="Complaints & escalation"
        />
        <div className="mx-auto max-w-[860px] px-6 pb-14 pt-8">

          <div className="mt-4 rounded-xl border border-warning/40 bg-warning-soft px-5 py-4">
            <p className="text-[13.5px] font-semibold text-warning">Prototype feature — not BIS&apos;s official system</p>
            <p className="mt-1 max-w-[62ch] text-[13.5px] leading-relaxed text-warning">
              Nothing submitted below is sent to BIS. It is stored by this assistant only, to demonstrate the workflow.
              For a real complaint or grievance, use BIS&apos;s own channels listed at the bottom of this page.
            </p>
          </div>

          <ComplaintForm />
          <ComplaintLookup />
          <EscalationForm />

          <section className="mt-10" aria-labelledby="official-channels">
            <h2 id="official-channels" className="text-[13px] font-semibold uppercase tracking-wider text-ink-faint">
              Official BIS channels
            </h2>
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface-raised">
              {CONTACT_CHANNELS.map((c) => (
                <li key={c.href}>
                  <a href={c.href} target="_blank" rel="noopener noreferrer" className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-alt">
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-medium text-navy">{c.label}</span>
                      {c.note && <span className="mt-0.5 block text-[12.5px] text-ink-faint">{c.note}</span>}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ComplaintForm() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("other");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [standardNumber, setStandardNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ referenceId: string; notice: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getOrCreateSessionId(),
          category,
          description,
          contactInfo: contactInfo || undefined,
          standardNumber: standardNumber || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit complaint");
      setResult(data);
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="text-[15px] font-semibold text-navy">File a complaint</h2>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-soft">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-[13.5px]"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-soft">
          Related standard (optional)
          <input
            value={standardNumber}
            onChange={(e) => setStandardNumber(e.target.value)}
            placeholder="e.g. IS 302 Part 2/Sec 15:2009"
            className="rounded-md border border-border bg-surface px-3 py-2 text-[13.5px]"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-soft">
          Description
          <textarea
            required
            minLength={10}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="rounded-md border border-border bg-surface px-3 py-2 text-[13.5px]"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] font-medium text-ink-soft">
          Contact info (optional)
          <input
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-[13.5px]"
          />
        </label>
        <button
          type="submit"
          disabled={submitting || description.trim().length < 10}
          className="self-start rounded-md bg-navy-solid px-4 py-2 text-[13.5px] font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        {result && (
          <p className="text-[13px] text-success">
            Recorded as <strong>{result.referenceId}</strong>. {result.notice}
          </p>
        )}
      </form>
    </section>
  );
}

function ComplaintLookup() {
  const [referenceId, setReferenceId] = useState("");
  const [status, setStatus] = useState<{ status: string; category: string; createdAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    try {
      const res = await fetch(`/api/v1/complaints?referenceId=${encodeURIComponent(referenceId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Not found");
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="text-[15px] font-semibold text-navy">Look up a complaint</h2>
      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          value={referenceId}
          onChange={(e) => setReferenceId(e.target.value)}
          placeholder="CMP-2026-XXXXXX"
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-[13.5px]"
        />
        <button type="submit" className="rounded-md border border-border-strong px-4 py-2 text-[13.5px] font-medium text-navy">
          Look up
        </button>
      </form>
      {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
      {status && (
        <p className="mt-2 text-[13px] text-ink-soft">
          Status: <strong>{status.status}</strong> · Category: {status.category} · Filed {new Date(status.createdAt).toLocaleDateString()}
        </p>
      )}
    </section>
  );
}

function EscalationForm() {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ referenceId: string; notice: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getOrCreateSessionId(), reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit request");
      setResult(data);
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="text-[15px] font-semibold text-navy">Ask for a human officer</h2>
      <p className="mt-1 text-[13px] text-ink-faint">
        If the assistant couldn&apos;t resolve your question, say why below. This records a request in this
        prototype — it does not currently route to a real BIS officer.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        <textarea
          required
          minLength={5}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="rounded-md border border-border bg-surface px-3 py-2 text-[13.5px]"
        />
        <button
          type="submit"
          disabled={submitting || reason.trim().length < 5}
          className="self-start rounded-md bg-navy-solid px-4 py-2 text-[13.5px] font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Request escalation"}
        </button>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        {result && (
          <p className="text-[13px] text-success">
            Recorded as <strong>{result.referenceId}</strong>. {result.notice}
          </p>
        )}
      </form>
    </section>
  );
}
