"use client";

import Link from "next/link";
import { ExternalLinkIcon } from "@/components/ui/icons";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Quick links definitions pointing to verified official BIS portals.
 */
const LINKS = [
  { label: "BIS Official Website", href: "https://www.bis.gov.in", external: true },
  { label: "BIS CARE App", href: "https://www.bis.gov.in/bis-apps/?lang=hi", external: true },
  { label: "Manak Online", href: "https://www.manakonline.in", external: true },
  { label: "Compulsory Certification (QCOs)", href: "https://www.bis.gov.in/product-certification/products-under-compulsory-certification/?lang=en", external: true },
  { label: "BIS Laboratory Services", href: "https://www.bis.gov.in/laboratorys/laboratory-services-overview/?lang=en", external: true },
];

export function QuickLinks() {
  const { t } = useLanguage();
  const rowClass =
    "group flex items-center justify-between gap-3 rounded-xl px-3 py-3 text-[13.5px] font-semibold text-navy transition-colors hover:bg-surface-alt hover:text-blue";

  return (
    <aside className="rounded-2xl border border-border bg-surface-raised p-5 shadow-sm lg:self-start">
      <span aria-hidden="true" className="mb-3 block h-1 w-10 rounded-full bg-blue" />
      <h2 className="text-[17px] font-bold text-navy">{t.quicklinks.heading}</h2>
      <ul className="mt-3 divide-y divide-border">
        {LINKS.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a href={link.href} target="_blank" rel="noopener noreferrer" className={rowClass}>
                <span>{link.label}</span>
                <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint transition-colors group-hover:text-blue" />
              </a>
            ) : (
              <Link href={link.href} className={rowClass}>
                <span>{link.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
