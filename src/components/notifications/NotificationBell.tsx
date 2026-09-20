"use client";

import { useState, useCallback } from "react";
import { getOrCreateSessionId } from "@/lib/client/session-id";

interface NotificationRow {
  id: string;
  kind: string;
  message: string;
  relatedReferenceId: string | null;
  read: boolean;
  createdAt: string;
}

/**
 * Site-wide notification bell, fed by /api/v1/notifications. Scoped to
 * the anonymous browser session id (session-id.ts). Deliberately fetches
 * on open, not on mount/on an interval — same reasoning as BisChatBot
 * (also rendered on every page): a global widget doing background network
 * I/O on every page load is both unnecessary for a low-frequency feed and
 * a footgun for anything that asserts against a shared fetch mock.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const sessionId = getOrCreateSessionId();
      if (!sessionId) return;
      const res = await fetch(`/api/v1/notifications?sessionId=${encodeURIComponent(sessionId)}`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
      setLoaded(true);
    } catch {
      // Silent — a failed poll shouldn't disrupt the rest of the page.
    }
  }, []);

  function toggleOpen() {
    setOpen((o) => {
      const next = !o;
      if (next && !loaded) fetchNotifications();
      return next;
    });
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      const sessionId = getOrCreateSessionId();
      await fetch("/api/v1/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch {
      // Optimistic UI update already applied; a failed sync isn't fatal.
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={toggleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-surface-alt"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-surface-raised p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-[12.5px] font-semibold text-navy">Notifications</span>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-[11.5px] text-blue hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-2 py-4 text-center text-[12.5px] text-ink-faint">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => (
                  <li key={n.id} className={`px-2 py-2.5 text-[12.5px] leading-relaxed ${n.read ? "text-ink-faint" : "text-ink-soft"}`}>
                    <p>{n.message}</p>
                    <p className="mt-1 text-[11px] text-ink-faint">{new Date(n.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
