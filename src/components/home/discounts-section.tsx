import { ButtonLink, Card, Section, SectionHeading } from "@/components/ui";
import { BUNDLE_DISCOUNT_TIERS, TERM_DISCOUNT_TIERS } from "@/lib/pricing";

/** Explains the automatic term and bundle discounts. */
export function DiscountsSection() {
  const termTiers = [...TERM_DISCOUNT_TIERS].sort(
    (a, b) => a.minMonths - b.minMonths,
  );
  const bundleTiers = [...BUNDLE_DISCOUNT_TIERS].sort(
    (a, b) => a.minSlots - b.minSlots,
  );

  return (
    <div className="border-y border-line bg-panel">
      <Section>
        <SectionHeading
          eyebrow="Bundles & discounts"
          title="The longer you stay, the less you pay."
          description="Discounts are applied automatically at checkout. Book more than one placement and a bundle discount stacks on top of your term discount."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {termTiers.map((tier) => (
            <Card
              key={tier.minMonths}
              className={
                tier.minMonths === 12
                  ? "border-accent/35 bg-accent-wash"
                  : undefined
              }
            >
              <p className="text-sm text-muted">
                {tier.minMonths} month{tier.minMonths === 1 ? "" : "s"}
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                {tier.bps === 0 ? "List" : `${tier.bps / 100}%`}
              </p>
              <p className="mt-1 text-xs text-muted">
                {tier.bps === 0 ? "Standard rate" : "off every placement"}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-5 rounded-2xl bg-surface p-6 ring-1 ring-line">
          <p className="text-sm font-semibold">Bundle discount</p>
          <p className="mt-1.5 text-sm text-muted">
            Applied on top of your term discount when you book multiple
            placements in one order.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {bundleTiers.map((tier) => (
              <span
                key={tier.minSlots}
                className="rounded-xl bg-panel px-4 py-2.5 text-sm ring-1 ring-line"
              >
                <strong className="font-semibold">
                  {tier.minSlots}+ placements
                </strong>
                <span className="ml-2 tabular-nums text-accent">
                  −{tier.bps / 100}%
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <ButtonLink href="/pricing" variant="secondary">
            See full pricing
          </ButtonLink>
        </div>
      </Section>
    </div>
  );
}
