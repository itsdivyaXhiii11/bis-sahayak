"use client";

import { useState } from "react";
import { SearchHero } from "@/components/query/SearchHero";
import { TrustCard } from "@/components/home/TrustCard";
import { ArchitecturalIllustration } from "@/components/home/ArchitecturalIllustration";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { BadgeCheckIcon } from "@/components/ui/icons";
import { SchemeDecisionTree } from "@/components/SchemeDecisionTree";

export function HeroSection({
  onSubmit,
  loading,
}: {
  onSubmit: (query: string) => void;
  loading: boolean;
}) {
  const { t } = useLanguage();
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <section className="relative">
      {/* Dark navy band: headline + search */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-deep via-navy-deep to-navy-solid pb-28 pt-14 text-white lg:pb-32 lg:pt-20">
        {/* Static technical/laboratory photograph as texture only — no motion */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.11] mix-blend-luminosity"
          style={{ backgroundImage: "var(--hero-bg)" }}
        />
        <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0" />
        <ArchitecturalIllustration className="pointer-events-none absolute inset-y-0 right-0 h-full w-[55%] text-white opacity-[0.08]" />

        <div className="relative z-10 mx-auto w-full max-w-[1280px] px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-[46px]">
                {t.hero.titleLine1}
                <br />
                {t.hero.titlePre}
                <span className="text-mint">{t.hero.titleHighlight}</span>
              </h1>
              <p className="mt-5 max-w-xl text-[16px] font-medium leading-relaxed text-white/80">{t.hero.subtitle}</p>

              <div className="mt-9 max-w-2xl">
                <SearchHero onSubmit={onSubmit} loading={loading} onDark />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setWizardOpen(true)}
                  className="group inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:border-white hover:bg-white hover:text-navy-deep sm:text-sm"
                >
                  <BadgeCheckIcon className="h-4.5 w-4.5 text-mint transition-colors group-hover:text-navy-deep" />
                  <span>Check Your Certification Route</span>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10.5px] font-bold text-white transition-colors group-hover:bg-navy-deep/10 group-hover:text-navy-deep">
                    Interactive Wizard
                  </span>
                </button>
              </div>
            </div>

            {/* How it works — three steps, no data claims, desktop only */}
            <aside
              aria-labelledby="hero-steps-heading"
              className="hidden rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm lg:block"
            >
              <h2
                id="hero-steps-heading"
                className="text-[12px] font-bold uppercase tracking-[0.16em] text-mint"
              >
                {t.hero.stepsHeading}
              </h2>
              <ol className="mt-6 space-y-7">
                {t.hero.steps.map((step, i) => (
                  <li key={step.title} className="relative flex gap-4">
                    {i < t.hero.steps.length - 1 && (
                      <span aria-hidden="true" className="absolute left-[15px] top-9 h-[calc(100%+0.5rem)] w-px bg-white/20" />
                    )}
                    <span
                      aria-hidden="true"
                      className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint text-[13px] font-extrabold text-navy-deep"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[15px] font-bold leading-snug">{step.title}</p>
                      <p className="mt-1 text-[13px] font-medium leading-relaxed text-white/75">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </div>
      </div>

      {/* Trust strip overlaps the bottom edge of the band */}
      <div className="relative z-20 mx-auto -mt-16 w-full max-w-[1280px] px-6">
        <TrustCard />
      </div>

      {/* Modal Scheme Decision Tree */}
      <SchemeDecisionTree
        mode="modal"
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
      />
    </section>
  );
}
