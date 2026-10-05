import Link from "next/link";

import { Section, SectionHeading, cx } from "@/components/ui";
import { BUNDLE_DISCOUNT_TIERS, TERM_DISCOUNT_TIERS } from "@/lib/pricing";

/** Explains the automatic term and bundle discounts. */
export function DiscountsSection() {
  const termTiers = [...TERM_DISCOUNT_TIERS].sort(
    (a, b) => a.minMonths - b.minMonths,
  );
  const bundleTiers = [...BUNDLE_DISCOUNT_TIERS].sort(
    (a, b) => a.minSlots - b.minSlots,
  );

  // Compact: one row of term tiers and one row of bundle tiers, both read
  // straight from the pricing engine so the copy can never drift from checkout.
  return (
    <Section className="py-16 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.6fr] lg:items-center">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Discounts"
            title="Stay longer, pay less."
            description="Applied automatically at checkout. Bundle discounts stack on top of term discounts."
          />
          <Link
            href="/pricing"
            className="group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-foreground"
          >
            See full pricing
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            >
              &rarr;
            </span>
          </Link>
        </div>

        <div className="space-y-3">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {termTiers.map((tier) => (
              <div
                key={tier.minMonths}
                className={cx(
                  "bg-surface px-4 py-4",
                  tier.minMonths === 12 && "bg-accent-wash",
                )}
              >
                <dt className="text-xs font-medium text-muted">
                  {tier.minMonths} month{tier.minMonths === 1 ? "" : "s"}
                </dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums tracking-tight">
                  {tier.bps === 0 ? "List" : `−${tier.bps / 100}%`}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
            <span className="font-semibold">Bundles</span>
            {bundleTiers.map((tier) => (
              <span
                key={tier.minSlots}
                className="rounded-lg bg-subtle px-2.5 py-1 text-[13px]"
              >
                {tier.minSlots}+ placements{" "}
                <span className="font-semibold tabular-nums text-success">
                  −{tier.bps / 100}%
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
