import Link from "next/link";

import { Section, SectionHeading } from "@/components/ui";
import { CheckGlyph } from "@/components/home/glyphs";
import { formatDate } from "@/lib/format";

/**
 * "Know what you're buying": a short checklist where every line points at
 * the page or data that backs it, so no claim floats on its own.
 */
export function TransparencySection({
  snapshotSource,
  snapshotEnd,
  isVerified,
}: {
  snapshotSource?: string;
  snapshotEnd?: Date;
  isVerified: boolean;
}) {
  const items: { title: string; body: string; href: string; cta: string }[] = [
    {
      title: isVerified ? "Verified, dated analytics" : "Dated analytics",
      body: `Figures come from ${snapshotSource ?? "X Analytics"}${
        snapshotEnd ? `, last updated ${formatDate(snapshotEnd)}` : ""
      }, including the metrics that fell.`,
      href: "/analytics",
      cta: "See analytics",
    },
    {
      title: "Published prices",
      body: "The same rate card for everyone. Term and bundle discounts apply automatically at checkout.",
      href: "/pricing",
      cta: "See pricing",
    },
    {
      title: "Live availability",
      body: "Placements show as booked the moment they are paid for, with the date they free up.",
      href: "/book",
      cta: "Check dates",
    },
    {
      title: "One brand per slot",
      body: "Each cover half and each bio line is exclusive to one advertiser for the whole term.",
      href: "/faq",
      cta: "Read the FAQ",
    },
    {
      title: "Reviewed before going live",
      body: "Every booking is reviewed. If it is declined, you are refunded in full.",
      href: "/transparency",
      cta: "How review works",
    },
    {
      title: "Track your campaign",
      body: "Use your booking reference to check status and dates at any time.",
      href: "/campaigns",
      cta: "Look up a booking",
    },
  ];

  return (
    <Section className="py-16 sm:py-20">
      <SectionHeading
        align="left"
        eyebrow="Transparency"
        title="Know what you're buying."
        description="No sales calls and no hidden terms. Each promise below links to the data or policy behind it."
      />
      <ul className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.title} className="flex gap-3.5 bg-surface p-5 sm:p-6">
            <span
              aria-hidden
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-wash text-success"
            >
              <CheckGlyph size={11} />
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {item.body}
              </p>
              <Link
                href={item.href}
                className="mt-2.5 inline-flex text-sm font-medium text-accent transition-colors hover:text-foreground"
              >
                {item.cta} <span aria-hidden className="ml-1">&rarr;</span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
