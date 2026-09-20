"use client";

import { ServiceCard, type ServiceCardVariant } from "@/components/home/ServiceCard";
import { DocumentIcon, ShieldCheckIcon, FlaskIcon, BalanceIcon } from "@/components/ui/icons";
import { useLanguage } from "@/components/providers/LanguageProvider";

const ICONS = [
  <DocumentIcon key="doc" className="h-6 w-6" />,
  <ShieldCheckIcon key="shield" className="h-6 w-6" />,
  <FlaskIcon key="flask" className="h-6 w-6" />,
  <BalanceIcon key="balance" className="h-6 w-6" />,
];

const TONES = ["blue", "green", "orange", "navy"] as const;
const HREFS = ["/standards", "/certification", "/testing", "/compare"];

/**
 * Bento layout: the first service is the large feature tile (two columns and
 * two rows on desktop), the next two sit beside it, and the fourth spans the
 * width underneath them. On smaller screens everything stacks in order.
 */
const LAYOUT: { variant: ServiceCardVariant; className: string }[] = [
  { variant: "featured", className: "md:col-span-2 lg:row-span-2" },
  { variant: "default", className: "" },
  { variant: "default", className: "" },
  { variant: "wide", className: "md:col-span-2" },
];

export function ServicesSection() {
  const { t } = useLanguage();

  return (
    <section id="services">
      <span aria-hidden="true" className="mb-4 block h-1 w-12 rounded-full bg-blue" />
      <h2 className="text-2xl font-bold tracking-tight text-navy sm:text-[28px]">{t.services.heading}</h2>
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {t.services.cards.map((card, i) => (
          <ServiceCard
            key={card.title}
            index={i}
            icon={ICONS[i]}
            title={card.title}
            description={card.description}
            href={HREFS[i]}
            tone={TONES[i]}
            variant={LAYOUT[i].variant}
            className={LAYOUT[i].className}
          />
        ))}
      </div>
    </section>
  );
}
