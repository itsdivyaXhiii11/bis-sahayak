/**
 * Lightweight PII redaction for anything that gets logged or persisted
 * outside a user's own submitted record (query_logs, console output,
 * admin-facing aggregate views). Deliberately simple pattern-matching, not
 * an NLP PII model — this project's own philosophy (docs/ARCHITECTURE.md:
 * prefer deterministic, auditable behavior over an LLM guess) applies here
 * too. False negatives are possible; this reduces incidental PII exposure
 * in logs, it does not guarantee none.
 *
 * NOT applied to a citizen's own complaint/escalation record (they typed
 * it for themselves, to be read back to them) — only to places that data
 * flows onward: query_logs.query, and anything printed via console.*.
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Indian mobile numbers: optional +91/0 prefix, then a 10-digit number
// starting 6-9. Deliberately not a generic "any 10-digit number" match to
// avoid over-redacting standard numbers, pin codes, etc.
const PHONE_RE = /(?:\+91[\s-]?|0)?[6-9]\d{9}\b/g;

// Aadhaar-shaped: 12 digits, optionally space/hyphen grouped as 4-4-4.
const AADHAAR_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

// PAN-shaped: 5 letters, 4 digits, 1 letter.
const PAN_RE = /\b[A-Z]{5}\d{4}[A-Z]\b/g;

export function redactPii(input: string): string {
  if (!input) return input;
  return input
    .replace(EMAIL_RE, "[redacted-email]")
    .replace(PAN_RE, "[redacted-pan]")
    .replace(AADHAAR_RE, "[redacted-id-number]")
    .replace(PHONE_RE, "[redacted-phone]");
}

/** Wraps console.log/warn/error style logging with redaction applied to string args. Non-string args pass through unchanged (redacting inside arbitrary objects risks corrupting data structures we actually need). */
export function logRedacted(level: "log" | "warn" | "error", ...args: unknown[]): void {
  const safe = args.map((a) => (typeof a === "string" ? redactPii(a) : a));
  console[level](...safe);
}
