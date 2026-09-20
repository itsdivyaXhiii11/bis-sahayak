"use client";

/**
 * Client-generated, anonymous session identifier — used to scope
 * complaints/escalations/notifications to "this browser," not any real
 * account. Persisted in localStorage so a returning visitor keeps seeing
 * their own notifications; there is no server-side account behind it.
 */
const KEY = "bis-session-id";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  const fresh = `sess_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  // Private-mode / disabled storage can make localStorage throw on either
  // call (same failure mode this app already defends against elsewhere —
  // see HomeClient.test.tsx's storage-throwing cases). Falling back to a
  // fresh, unpersisted id keeps the feature usable rather than crashing
  // the caller; it just won't survive a reload in that browser.
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing) return existing;
    window.localStorage.setItem(KEY, fresh);
    return fresh;
  } catch {
    return fresh;
  }
}
