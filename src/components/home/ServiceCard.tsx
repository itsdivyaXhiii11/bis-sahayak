import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/ui/icons";

const TONE_CLASSES = {
  blue: {
    badge: "bg-blue/10 text-blue dark:bg-blue/20",
    rail: "bg-blue",
    border: "hover:border-blue/50 dark:hover:border-blue/40",
    arrow: "group-hover:bg-blue group-hover:text-white",
  },
  green: {
    badge: "bg-success/10 text-success dark:bg-success/20",
    rail: "bg-success",
    border: "hover:border-success/50 dark:hover:border-success/40",
    arrow: "group-hover:bg-success group-hover:text-white",
  },
  orange: {
    badge: "bg-orange/10 text-orange dark:bg-orange/20",
    rail: "bg-orange",
    border: "hover:border-orange/50 dark:hover:border-orange/40",
    arrow: "group-hover:bg-orange group-hover:text-white",
  },
  navy: {
    badge: "bg-navy/10 text-navy dark:bg-navy/20",
    rail: "bg-navy",
    border: "hover:border-navy/50 dark:hover:border-navy/40",
    arrow: "group-hover:bg-navy-solid group-hover:text-white",
  },
} as const;

export type ServiceCardVariant = "default" | "featured" | "wide";

export function ServiceCard({
  icon,
  title,
  description,
  href,
  tone,
  index,
  variant = "default",
  className = "",
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  tone: keyof typeof TONE_CLASSES;
  /** Zero-based position; shown as a decorative 01, 02… marker. */
  index: number;
  variant?: ServiceCardVariant;
  className?: string;
}) {
  const styles = TONE_CLASSES[tone];
  const marker = String(index + 1).padStart(2, "0");

  if (variant === "featured") {
    return (
      <Link
        href={href}
        className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br from-navy-deep to-navy-solid p-8 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-10 ${className}`}
      >
        <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0 opacity-80" />
        <div className="relative flex items-start justify-between">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-mint [&>svg]:h-8 [&>svg]:w-8">
            {icon}
          </span>
          <span aria-hidden="true" className="font-mono text-sm font-bold tracking-widest text-white/70">
            {marker}
          </span>
        </div>
        <div className="relative mt-16">
          <h3 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h3>
          <p className="mt-3 max-w-md text-[15px] font-medium leading-relaxed text-white/80">{description}</p>
          <span className="mt-8 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-navy-deep transition-transform duration-300 group-hover:translate-x-1.5">
            <ArrowRightIcon className="h-5 w-5 stroke-[2]" />
          </span>
        </div>
      </Link>
    );
  }

  const isWide = variant === "wide";

  return (
    <Link
      href={href}
      className={`group relative flex overflow-hidden rounded-2xl border border-border bg-surface-raised p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        isWide ? "flex-col gap-5 sm:flex-row sm:items-center sm:gap-6" : "flex-col"
      } ${styles.border} ${className}`}
    >
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${styles.rail}`} />
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${styles.badge}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[16px] font-bold text-navy transition-colors duration-200 group-hover:text-blue">
            {title}
          </h3>
          <span aria-hidden="true" className="font-mono text-[11px] font-bold tracking-widest text-ink-faint">
            {marker}
          </span>
        </div>
        <p className="mt-2 text-[13.5px] font-medium leading-relaxed text-ink-soft">{description}</p>
      </div>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-full bg-surface-alt text-ink-soft transition-all duration-300 group-hover:translate-x-1 ${styles.arrow} ${
          isWide ? "sm:self-center" : "mt-auto"
        }`}
      >
        <ArrowRightIcon className="h-4 w-4 stroke-[2]" />
      </span>
    </Link>
  );
}
