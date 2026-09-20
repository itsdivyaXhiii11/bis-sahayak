import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";

export interface BannerCrumb {
  label: string;
  /** Omit for the current page. */
  href?: string;
}

/**
 * The shared page header for inner pages: a dark teal band carrying the
 * breadcrumb, the page's one <h1>, and its intro text. Content is passed in
 * by each page — this component only owns the layout — so every inner page
 * opens the same way instead of each inventing its own header.
 */
export function PageBanner({
  crumbs,
  back,
  homeLabel = "Home",
  eyebrow,
  title,
  titleLang,
  description,
  children,
  width = "max-w-[1100px]",
}: {
  crumbs?: BannerCrumb[];
  /** A single "back" link instead of a breadcrumb trail. */
  back?: { href: string; label: string };
  homeLabel?: string;
  eyebrow?: string;
  title: string;
  titleLang?: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Tailwind max-width class; match the page body below so edges line up. */
  width?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-deep to-navy-solid text-white">
      <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0" />
      <div className={`relative mx-auto ${width} px-4 py-10 sm:px-6 sm:py-14`}>
        {back ? (
          <nav aria-label="Breadcrumb" className="text-xs">
            <Link
              href={back.href}
              className="inline-flex items-center gap-1.5 font-semibold text-white/80 transition-colors hover:text-white hover:underline"
            >
              <span aria-hidden="true">&larr;</span> {back.label}
            </Link>
          </nav>
        ) : crumbs ? (
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-white/75">
            <Link href="/" className="transition-colors hover:text-white hover:underline">
              {homeLabel}
            </Link>
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                <ChevronRightIcon className="h-3 w-3" />
                {c.href ? (
                  <Link href={c.href} className="transition-colors hover:text-white hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span className="font-medium text-white">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}

        {eyebrow && (
          <p className="mt-6 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-mint">{eyebrow}</p>
        )}
        <h1
          lang={titleLang}
          className={`max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-[38px] ${eyebrow ? "mt-2" : "mt-6"}`}
        >
          {title}
        </h1>
        {description && (
          <div className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/80">{description}</div>
        )}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
