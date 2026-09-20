"use client";

import { useState } from "react";
import { SearchIcon, ArrowRightIcon, CloseIcon } from "@/components/ui/icons";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { VoiceInputButton } from "@/components/query/VoiceInputButton";

export function SearchHero({
  onSubmit,
  loading,
  compact = false,
  initialValue = "",
  onClear,
  onDark = false,
}: {
  onSubmit: (query: string) => void;
  loading: boolean;
  compact?: boolean;
  initialValue?: string;
  onClear?: () => void;
  /** Set when the search sits on a dark navy band, so the helper text and chips stay readable. */
  onDark?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const { t } = useLanguage();

  function submit(q: string) {
    if (q.trim()) onSubmit(q.trim());
  }


  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
      >
        <div
          className={`flex items-center gap-2 rounded-xl border border-border-strong bg-surface-raised focus-within:border-blue ${
            onDark ? "shadow-xl shadow-black/20" : "shadow-sm"
          } ${compact ? "p-1.5" : "p-2"}`}
        >
          <SearchIcon className="ml-2.5 h-5 w-5 shrink-0 text-ink-faint" />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={compact ? t.hero.searchPlaceholderCompact : t.hero.searchPlaceholderFull}
            aria-label={t.hero.searchPlaceholderCompact}
            // min-w-0: without it, a flex item's default content-based
            // minimum width (not 0) stops it shrinking below the
            // placeholder text's natural width, pushing the submit
            // button off-screen at narrow viewports (E2E responsive
            // suite, 2026-09-03 — confirmed overflow at 360/390px).
            className={`min-w-0 flex-1 bg-transparent px-1 text-ink outline-none placeholder:text-ink-faint ${
              compact ? "py-2 text-sm" : "py-3 text-[15px]"
            }`}
          />
          {compact && value && onClear && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                onClear();
              }}
              aria-label="Clear search"
              className="rounded-md p-1.5 text-ink-faint transition-colors hover:bg-surface-alt hover:text-ink"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          )}
          <VoiceInputButton onResult={(transcript) => setValue(transcript)} />
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg bg-blue font-medium text-white transition-colors hover:bg-navy-deep disabled:opacity-40 ${
              compact ? "px-4 py-2 text-sm" : "px-6 py-3 text-[15px]"
            }`}
          >
            {loading ? t.hero.searching : t.hero.searchButton}
            {!loading && <ArrowRightIcon className="h-4 w-4" />}
          </button>
        </div>
      </form>

      {!compact && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`text-xs font-medium ${onDark ? "text-white/75" : "text-ink-faint"}`}>{t.hero.popularLabel}</span>
          {t.hero.popularItems.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setValue(ex);
                submit(ex);
              }}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                onDark
                  ? "border-white/25 bg-white/10 text-white hover:bg-white hover:text-navy-deep"
                  : "border-border bg-surface-raised text-ink-soft hover:border-blue hover:text-blue"
              }`}
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
