import { Header } from "@/components/layout/Header";
import { PageBanner } from "@/components/layout/PageBanner";
import { Footer } from "@/components/layout/Footer";
import { LaboratoriesDirectory } from "@/components/testing/LaboratoriesDirectory";
import { loadLaboratories } from "@/lib/laboratories";

// The dataset is a static, versioned JSON file (see
// scripts/data-laboratories-convert.ts) rather than a live database table,
// but recognition status/validity is time-sensitive enough to render fresh
// per request rather than caching a stale build.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Recognised Laboratories | BIS Navigator",
  description:
    "Search BIS-recognised (Group 1) testing laboratories by name, city, state, and current recognition status.",
};

export default async function LaboratorySearchPage() {
  const laboratories = await loadLaboratories();

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="flex-1">
        <PageBanner
          eyebrow="BIS Testing"
          crumbs={[{ label: "Testing", href: "/testing" }, { label: "Laboratory Search" }]}
          title="Recognised laboratories"
          description={
            <>
              {laboratories.length} BIS-recognised (Group 1) testing laboratories, sourced directly from the official
              recognition list. Search by name or location, and filter by current recognition status.
            </>
          }
        >
          <p className="max-w-2xl text-[13px] leading-relaxed text-white/75">
            This directory does not indicate which standards or product categories a laboratory is equipped to test —
            that scope isn&apos;t part of the source recognition list. Confirm testing scope directly with the
            laboratory, or via the{" "}
            <a
              href="https://www.bis.gov.in/laboratorys/testing-overview/?lang=en"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-mint hover:underline"
            >
              official BIS testing portal
            </a>
            .
          </p>
        </PageBanner>

        <section className="px-6 py-10">
          <div className="mx-auto max-w-[1100px]">
            <LaboratoriesDirectory laboratories={laboratories} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
