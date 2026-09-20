"use client";

import { ShieldCheckIcon, CheckCircleIcon } from "@/components/ui/icons";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function TrustCard() {
  const { t } = useLanguage();

  return (
    <div className="w-full rounded-2xl border border-border bg-surface-raised p-6 shadow-xl shadow-navy-deep/10 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-center lg:gap-10">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue/10 text-blue dark:bg-blue/20">
              <ShieldCheckIcon className="h-5 w-5 stroke-[2]" />
            </span>
            <h2 className="text-[17px] font-bold text-navy">{t.trust.heading}</h2>
          </div>
          <p className="mt-3 text-[13.5px] font-medium leading-relaxed text-ink-soft">{t.trust.description}</p>
        </div>

        <ul className="grid gap-x-8 gap-y-3 border-t border-border pt-5 sm:grid-cols-2 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          {t.trust.rows.map((row) => (
            <li key={row} className="flex items-center gap-3 text-[14px] font-semibold text-ink-soft">
              <CheckCircleIcon className="h-5 w-5 shrink-0 text-blue" />
              {row}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
