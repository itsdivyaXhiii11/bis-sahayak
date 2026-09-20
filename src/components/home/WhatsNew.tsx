"use client";

import Link from "next/link";
import { DocumentIcon, ArrowRightIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { useLanguage } from "@/components/providers/LanguageProvider";

/**
 * Top verified Indian Standards from the updated official BIS dataset.
 */
const FEATURED_STANDARDS = [
  {
    standardNumber: "IS 14543:2016",
    title: "Packaged Drinking Water",
    category: "Packaged Water & Beverages",
    scheme: "Scheme-I (ISI)",
    meta: "Mandatory QCO · Active",
    id: "is-14543-2016",
  },
  {
    standardNumber: "IS 2347:2017",
    title: "Domestic Pressure Cookers",
    category: "Kitchen & Domestic Appliances",
    scheme: "Scheme-I (ISI)",
    meta: "Mandatory QCO · Active",
    id: "is-2347-2017",
  },
  {
    standardNumber: "IS 16046 (Part 2):2018",
    title: "Lithium Cells & Power Banks",
    category: "IT & Consumer Electronics",
    scheme: "Scheme-II (CRS)",
    meta: "Mandatory CRS · Active",
    id: "is-16046-part-2-2018",
  },
  {
    standardNumber: "IS 1417:2016",
    title: "Gold & Silver Jewellery Hallmarking",
    category: "Precious Metals",
    scheme: "Hallmarking (HUID)",
    meta: "Mandatory 6-Digit HUID",
    id: "is-1417-2016",
  },
  {
    standardNumber: "IS 4151:2015",
    title: "Protective Helmets for Two-Wheelers",
    category: "Safety Gear",
    scheme: "Scheme-I (ISI)",
    meta: "Mandatory QCO · Active",
    id: "is-4151-2015",
  },
  {
    standardNumber: "IS 16333 (Part 3):2022",
    title: "Mobile Phone Indian Language Support",
    category: "Telecommunications",
    scheme: "Scheme-II (CRS)",
    meta: "22 Scheduled Languages",
    id: "is-16333-part-3-2022",
  },
];

export function WhatsNew() {
  const { t } = useLanguage();

  return (
    <section className="border-y border-border bg-surface-alt">
      <div className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span aria-hidden="true" className="mb-4 block h-1 w-12 rounded-full bg-blue" />
            <div className="flex items-center gap-2.5">
              <ShieldCheckIcon className="h-6 w-6 text-blue" />
              <h2 className="text-2xl font-bold tracking-tight text-navy sm:text-[28px]">{t.whatsnew.heading}</h2>
            </div>
            <p className="mt-2 text-[14px] text-ink-soft">
              22+ verified Gazette standards with testing criteria &amp; QCO status.
            </p>
          </div>
          <Link
            href="/standards"
            className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface-raised px-4 py-2 text-[13px] font-semibold text-blue transition-colors hover:border-blue hover:bg-blue hover:text-white"
          >
            <span>{t.whatsnew.viewAll}</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_STANDARDS.map((item) => (
            <li key={item.standardNumber}>
              <Link
                href={`/standards/${item.id}`}
                className="group flex h-full flex-col rounded-2xl border border-border bg-surface-raised p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue/40 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-alt text-navy transition-colors group-hover:bg-blue group-hover:text-white">
                    <DocumentIcon className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-surface-alt px-2.5 py-1 text-[10.5px] font-semibold text-ink-soft">
                    {item.scheme}
                  </span>
                </div>

                <p className="mt-4 font-mono text-[14px] font-bold text-navy transition-colors group-hover:text-blue">
                  {item.standardNumber}
                </p>
                <p className="mt-1 text-[15px] font-semibold leading-snug text-ink">{item.title}</p>
                <p className="mt-1 text-[12px] text-ink-faint">{item.category}</p>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="text-[12px] font-semibold text-blue">{item.meta}</span>
                  <ArrowRightIcon className="h-4 w-4 shrink-0 text-ink-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-blue" />
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <span className="text-ink-faint">Verified against Gazette Orders</span>
          <Link href="/standards" className="flex items-center gap-1 text-[13px] font-bold text-blue hover:underline">
            <span>Browse All 22+ Standards</span>
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
