import { Badge, Card, Section, SectionHeading } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import {
  BUNDLE_DISCOUNT_TIERS,
  TERM_DISCOUNT_TIERS,
  type PricingQuote,
} from "@/lib/pricing";

/**
 * The discount ladders plus a worked example.
 *
 * The example is computed by the real pricing engine and passed in, so this
 * page can never advertise a total that differs from checkout.
 */
export function DiscountTables({ takeover }: { takeover: PricingQuote }) {
  return (
    <div className="border-y border-line bg-panel">
      <Section>
        <SectionHeading
          eyebrow="Automatic discounts"
          title="Stacked, not haggled"
          description="Term and bundle discounts both apply to the placement subtotal, so they stack."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <Card>
            <h2 className="text-base font-semibold">By term length</h2>
            <ul className="mt-5 space-y-3">
              {[...TERM_DISCOUNT_TIERS]
                .sort((a, b) => a.minMonths - b.minMonths)
                .map((tier) => (
                  <li
                    key={tier.minMonths}
                    className="flex items-center justify-between gap-3 rounded-xl bg-panel px-4 py-3 text-sm ring-1 ring-line"
                  >
                    <span>
                      {tier.minMonths} month{tier.minMonths === 1 ? "" : "s"} or
                      more
                    </span>
                    <span className="font-semibold tabular-nums text-accent">
                      {tier.bps === 0 ? "List price" : `−${tier.bps / 100}%`}
                    </span>
                  </li>
                ))}
            </ul>
          </Card>

          <Card>
            <h2 className="text-base font-semibold">By number of placements</h2>
            <ul className="mt-5 space-y-3">
              {[...BUNDLE_DISCOUNT_TIERS]
                .sort((a, b) => a.minSlots - b.minSlots)
                .map((tier) => (
                  <li
                    key={tier.minSlots}
                    className="flex items-center justify-between gap-3 rounded-xl bg-panel px-4 py-3 text-sm ring-1 ring-line"
                  >
                    <span>{tier.minSlots} placements or more</span>
                    <span className="font-semibold tabular-nums text-accent">
                      −{tier.bps / 100}%
                    </span>
                  </li>
                ))}
            </ul>
          </Card>
        </div>

        <Card className="mt-5 border-accent/35 bg-accent-wash">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-base font-semibold">
              Worked example · full takeover for 12 months
            </h2>
            <Badge tone="accent">
              Save {formatMoney(takeover.totalSavingsCents)}
            </Badge>
          </div>
          <dl className="mt-5 space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">
                All {takeover.lineItems.length} placements × 12 months
              </dt>
              <dd className="tabular-nums">
                {formatMoney(takeover.placementSubtotalCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">
                Term discount ({takeover.termDiscountBps / 100}%)
              </dt>
              <dd className="tabular-nums text-success">
                −{formatMoney(takeover.termDiscountCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">
                Bundle discount ({takeover.bundleDiscountBps / 100}%)
              </dt>
              <dd className="tabular-nums text-success">
                −{formatMoney(takeover.bundleDiscountCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Promo post (bundled)</dt>
              <dd className="tabular-nums">
                {formatMoney(takeover.promoAddonCents)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-line pt-3 text-base font-semibold">
              <dt>Total for the year</dt>
              <dd className="tabular-nums">
                {formatMoney(takeover.totalCents)}
              </dd>
            </div>
          </dl>
        </Card>
      </Section>
    </div>
  );
}
