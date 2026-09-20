"use client";

import { useEffect, useState } from "react";

/**
 * Internal ops dashboard — login-gated (src/lib/admin-auth.ts), read-only
 * aggregate views plus the live-ingestion upload form. Not linked from
 * any public nav; reached by URL only, same as the original prototype
 * this was ported from.
 */

interface Stats {
  windowDays: number;
  queryVolumeByDay: { day: string; count: number }[];
  confidenceBreakdown: { confidence: string | null; count: number }[];
  outcomeBreakdown: { outcome: string | null; count: number }[];
  feedback: { total: number; byReason: { reason: string; count: number }[] };
  complaintsTotal: number;
  escalationsTotal: number;
  lowConfidenceGaps: { id: string; query: string; confidence: string | null; outcome: string | null; createdAt: string }[];
}

type Tab = "stats" | "complaints" | "escalations" | "ingest";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Cheap probe: a stats call either succeeds (cookie valid) or 401s.
    fetch("/api/v1/admin/stats")
      .then((r) => setAuthed(r.ok))
      .finally(() => setChecking(false));
  }, []);

  if (checking) return <div className="p-10 text-center text-[13.5px] text-ink-faint">Loading...</div>;
  return authed ? <Dashboard onLogout={() => setAuthed(false)} /> : <LoginForm onSuccess={() => setAuthed(true)} />;
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-xl border border-border bg-surface-raised p-6">
        <h1 className="text-[17px] font-semibold text-navy">Admin sign in</h1>
        <label className="mt-4 flex flex-col gap-1.5 text-[13px] font-medium text-ink-soft">
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="rounded-md border border-border bg-surface px-3 py-2 text-[13.5px]" />
        </label>
        <label className="mt-3 flex flex-col gap-1.5 text-[13px] font-medium text-ink-soft">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-md border border-border bg-surface px-3 py-2 text-[13.5px]" />
        </label>
        <button type="submit" disabled={submitting} className="mt-4 w-full rounded-md bg-navy-solid px-4 py-2 text-[13.5px] font-medium text-white disabled:opacity-50">
          {submitting ? "Signing in..." : "Sign in"}
        </button>
        {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
      </form>
    </div>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("stats");

  async function logout() {
    await fetch("/api/v1/admin/logout", { method: "POST" }).catch(() => {});
    onLogout();
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex items-center justify-between border-b border-border bg-surface-raised px-6 py-4">
        <h1 className="text-[16px] font-semibold text-navy">BIS Sahayak — Admin</h1>
        <button onClick={logout} className="text-[13px] text-ink-faint hover:text-blue hover:underline">Sign out</button>
      </header>
      <nav className="flex gap-1 border-b border-border bg-surface-raised px-6">
        {(["stats", "complaints", "escalations", "ingest"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-3 text-[13.5px] font-medium capitalize ${tab === t ? "border-blue text-navy" : "border-transparent text-ink-faint hover:text-ink-soft"}`}
          >
            {t}
          </button>
        ))}
      </nav>
      <main className="mx-auto max-w-[1100px] px-6 py-8">
        {tab === "stats" && <StatsTab />}
        {tab === "complaints" && <ListTab endpoint="/api/v1/admin/complaints" itemsKey="complaints" columns={["referenceId", "category", "status", "createdAt"]} />}
        {tab === "escalations" && <ListTab endpoint="/api/v1/admin/escalations" itemsKey="escalations" columns={["referenceId", "reason", "status", "createdAt"]} />}
        {tab === "ingest" && <IngestTab />}
      </main>
    </div>
  );
}

function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    fetch("/api/v1/admin/stats").then((r) => r.json()).then(setStats);
  }, []);
  if (!stats) return <p className="text-[13.5px] text-ink-faint">Loading...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Complaints (all time)" value={stats.complaintsTotal} />
        <StatCard label="Escalations (all time)" value={stats.escalationsTotal} />
        <StatCard label="Feedback submitted" value={stats.feedback.total} />
      </div>

      <div className="rounded-xl border border-border bg-surface-raised p-5">
        <h2 className="text-[13.5px] font-semibold text-navy">Query volume — last {stats.windowDays} days</h2>
        <ul className="mt-3 flex flex-col gap-1 text-[12.5px] text-ink-soft">
          {stats.queryVolumeByDay.map((d) => (
            <li key={d.day} className="flex justify-between border-b border-border/60 py-1">
              <span>{d.day}</span>
              <span>{d.count}</span>
            </li>
          ))}
          {stats.queryVolumeByDay.length === 0 && <li className="text-ink-faint">No queries logged yet.</li>}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="text-[13.5px] font-semibold text-navy">Confidence breakdown</h2>
          <ul className="mt-3 flex flex-col gap-1 text-[12.5px] text-ink-soft">
            {stats.confidenceBreakdown.map((c) => (
              <li key={c.confidence ?? "null"} className="flex justify-between border-b border-border/60 py-1">
                <span>{c.confidence ?? "unknown"}</span>
                <span>{c.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <h2 className="text-[13.5px] font-semibold text-navy">Outcome breakdown</h2>
          <ul className="mt-3 flex flex-col gap-1 text-[12.5px] text-ink-soft">
            {stats.outcomeBreakdown.map((o) => (
              <li key={o.outcome ?? "null"} className="flex justify-between border-b border-border/60 py-1">
                <span>{o.outcome ?? "unknown"}</span>
                <span>{o.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-raised p-5">
        <h2 className="text-[13.5px] font-semibold text-navy">Low-confidence gaps (most recent)</h2>
        <ul className="mt-3 flex flex-col gap-2 text-[12.5px] text-ink-soft">
          {stats.lowConfidenceGaps.map((q) => (
            <li key={q.id} className="border-b border-border/60 pb-2">
              <p className="text-ink-soft">&ldquo;{q.query}&rdquo;</p>
              <p className="text-ink-faint">{q.confidence} · {q.outcome} · {new Date(q.createdAt).toLocaleString()}</p>
            </li>
          ))}
          {stats.lowConfidenceGaps.length === 0 && <li className="text-ink-faint">None recorded.</li>}
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5">
      <p className="text-[12px] uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 text-[26px] font-semibold text-navy">{value}</p>
    </div>
  );
}

function ListTab({ endpoint, itemsKey, columns }: { endpoint: string; itemsKey: string; columns: string[] }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    fetch(endpoint).then((r) => r.json()).then((d) => setRows(d[itemsKey] ?? []));
  }, [endpoint, itemsKey]);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface-raised">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-border text-left text-ink-faint">
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 font-medium capitalize">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/60">
              {columns.map((c) => (
                <td key={c} className="max-w-xs truncate px-4 py-2.5 text-ink-soft" title={String(row[c] ?? "")}>
                  {String(row[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-ink-faint">Nothing here yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function IngestTab() {
  const [standardNumber, setStandardNumber] = useState("");
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    const form = new FormData();
    form.set("file", file);
    form.set("standardNumber", standardNumber);
    form.set("title", title);
    form.set("sourceUrl", sourceUrl);
    try {
      const res = await fetch("/api/v1/admin/ingest", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ingestion failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ingestion failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="text-[15px] font-semibold text-navy">Upload a standards document</h2>
      <p className="mt-1 text-[12.5px] text-ink-faint">
        Chunked and embedded into the live retrieval index immediately — no restart required.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <input value={standardNumber} onChange={(e) => setStandardNumber(e.target.value)} placeholder="Standard number, e.g. IS 302 Part 2/Sec 15:2009" className="rounded-md border border-border bg-surface px-3 py-2 text-[13.5px]" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-md border border-border bg-surface px-3 py-2 text-[13.5px]" />
        <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Source URL (bis.gov.in)" className="rounded-md border border-border bg-surface px-3 py-2 text-[13.5px]" />
        <input type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-[13px]" />
        <button type="submit" disabled={submitting || !file} className="self-start rounded-md bg-navy-solid px-4 py-2 text-[13.5px] font-medium text-white disabled:opacity-50">
          {submitting ? "Ingesting..." : "Ingest"}
        </button>
        {error && <p className="text-[13px] text-danger">{error}</p>}
        {result && <pre className="mt-2 whitespace-pre-wrap rounded-md bg-surface-alt p-3 text-[12px] text-ink-soft">{JSON.stringify(result, null, 2)}</pre>}
      </form>
    </div>
  );
}
