import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  Badge,
  ButtonArrow,
  ButtonLink,
  Card,
  Section,
  SectionHeading,
  TrustItem,
} from "@/components/ui";
import { DiscountTables } from "@/components/pricing/discount-tables";
import { PricingTiers } from "@/components/pricing/pricing-tiers";
import { PromoOffers } from "@/components/promo-offers";
import {
  BILLING_WINDOW_DAYS,
  getPrimaryCreator,
  monthlyImpressions,
  snapshotFor,
} from "@/server/creators";
import { availabilityForTerm } from "@/server/availability";
import { todayUtc } from "@/lib/dates";
import { costPerMille, formatMoney } from "@/lib/format";
import {
  LAUNCH_SPECIAL,
  quote,
  termMonthlyRateCents,
} from "@/lib/pricing";

/** Terms shown in the term-by-term rate table. */
const RATE_TERMS = [1, 3, 6, 12] as const;

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Half of the cover photo at $99/mo or a product link in the bio at " +
    "$89/mo, with lower rates on 3, 6 and 12-month terms, automatic bundle " +
    "discounts, and a $29 two-week launch special.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const creator = await getPrimaryCreator();
  if (!creator) notFound();

  // CPM is quoted off the 90-day window normalised to a month, matching the
  // analytics page, so the two can never disagree.
  const billing = snapshotFor(creator.analyticsSnapshots, BILLING_WINDOW_DAYS);
  const perMonth = monthlyImpressions(billing);
  const availability = await availabilityForTerm(creator.id, todayUtc(), 1);

  const sellable = creator.placements
    .filter((placement) => placement.kind !== "PROMO_POST")
    .sort((a, b) => b.priceMonthlyCents - a.priceMonthlyCents);

  // Worked example priced by the real engine, so this page can never drift
  // from what checkout actually charges.
  const takeover = quote({
    items: sellable.map((placement) => ({
      slotKey: placement.slotKey,
      label: placement.label,
      priceMonthlyCents: placement.priceMonthlyCents,
    })),
    months: 12,
    includePromoPost: true,
    promoPostPriceCents: creator.promoPostPriceCents,
  });

  const bioLink = sellable.find((placement) => placement.kind === "BIO_LINK");
  const coverHalf = sellable.find((placement) => placement.kind === "COVER_SLOT");
  const rateRows = [
    ...(coverHalf
      ? [{ label: "Half of the cover photo", priceMonthlyCents: coverHalf.priceMonthlyCents }]
      : []),
    ...(bioLink
      ? [{ label: "Product link in bio", priceMonthlyCents: bioLink.priceMonthlyCents }]
      : []),
  ];

  return (
    <>
      <div className="border-b border-line">
        <Section className="py-14 text-center sm:py-18">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold tracking-wide text-muted">
            Pricing
          </span>
          <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-extrabold tracking-[-0.03em] sm:text-6xl sm:leading-[1.02]">
            One rate card.{" "}
            <span className="text-accent">No negotiation.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-muted">
            Every price is published. Discounts are applied automatically at
            checkout based on your term and how many placements you book.
          </p>
        </Section>
      </div>

      <Section>
        <PricingTiers
          placements={sellable.map((placement) => ({
            slotKey: placement.slotKey,
            kind: placement.kind,
            label: placement.label,
            priceMonthlyCents: placement.priceMonthlyCents,
            available: availability[placement.slotKey]?.available ?? false,
            openCount: availability[placement.slotKey]
              ? Math.max(
                  0,
                  availability[placement.slotKey].maxConcurrent -
                    availability[placement.slotKey].overlapping,
                )
              : 0,
            maxConcurrent: placement.maxConcurrent,
          }))}
          promoPostPriceCents={creator.promoPostPriceCents}
          monthlyImpressions={perMonth}
        />

        {LAUNCH_SPECIAL.active && bioLink ? (
          <Card className="mt-10 flex flex-col gap-5 border-dashed border-accent/60 bg-accent-wash sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge tone="accent">Launch special</Badge>
              <h2 className="mt-3 text-lg font-bold">
                Product link in bio · 2 weeks
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                A short, low-risk way to test the audience: your product link
                in the bio for 14 days at a flat price. Bio link only; term and
                bundle discounts and the promo add-on do not apply.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-5">
              <p className="sm:text-right">
                <span className="block text-3xl font-extrabold tabular-nums">
                  {formatMoney(LAUNCH_SPECIAL.priceCents)}
                </span>
                <span className="text-xs text-muted">per 2 weeks</span>
              </p>
              <ButtonLink
                href={`/book?slots=${bioLink.slotKey}&term=launch`}
                size="sm"
              >
                Claim it
                <ButtonArrow />
              </ButtonLink>
            </div>
          </Card>
        ) : null}

        {/* Term-by-term rate card */}
        <div className="mt-16">
          <SectionHeading
            align="left"
            eyebrow="By term"
            title="Monthly rate by term length"
            description="The longer the term, the lower the monthly rate. Paid once, up front, for the whole term."
          />
          <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-5 py-3 font-semibold">Placement</th>
                  {RATE_TERMS.map((term) => (
                    <th key={term} className="px-5 py-3 text-right font-semibold">
                      {term} mo
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rateRows.map((row) => (
                  <tr key={row.label}>
                    <td className="px-5 py-4 font-semibold">{row.label}</td>
                    {RATE_TERMS.map((term) => {
                      const rate = termMonthlyRateCents(row.priceMonthlyCents, term);
                      return (
                        <td key={term} className="px-5 py-4 text-right tabular-nums">
                          <span className="font-semibold">
                            {formatMoney(rate)}
                          </span>
                          <span className="text-xs text-muted">/mo</span>
                          <span className="block text-xs text-muted">
                            {formatMoney(rate * term)} total
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-placement rate card */}
        <div className="mt-16">
          <SectionHeading
            align="left"
            eyebrow="Every placement"
            title="The full rate card"
            description="List price per placement, with live availability. Pick any combination on the booking page."
          />
          <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-surface">
            <ul className="divide-y divide-line">
              {sellable.map((placement) => {
                const open = availability[placement.slotKey]?.available ?? false;
                return (
                  <li
                    key={placement.id}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-subtle sm:flex-row sm:items-center sm:gap-6"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{placement.label}</p>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        {placement.summary}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                      {perMonth > 0 ? (
                        <span className="hidden text-xs tabular-nums text-muted md:block">
                          &asymp; $
                          {costPerMille(
                            placement.priceMonthlyCents,
                            perMonth,
                          ).toFixed(3)}{" "}
                          CPM
                        </span>
                      ) : null}
                      <Badge tone={open ? "success" : "danger"}>
                        {open
                          ? placement.maxConcurrent > 1
                            ? `${Math.max(
                                0,
                                (availability[placement.slotKey]?.maxConcurrent ??
                                  placement.maxConcurrent) -
                                  (availability[placement.slotKey]?.overlapping ??
                                    0),
                              )} of ${placement.maxConcurrent} open`
                            : "Open"
                          : "Booked"}
                      </Badge>
                      <span className="w-24 text-right text-lg font-semibold tabular-nums">
                        {formatMoney(placement.priceMonthlyCents)}
                        <span className="text-xs font-normal text-muted">/mo</span>
                      </span>
                      <ButtonLink
                        href={`/book?slots=${placement.slotKey}`}
                        variant="secondary"
                        size="sm"
                      >
                        {open ? "Book" : "Dates"}
                        <ButtonArrow />
                      </ButtonLink>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <PromoOffers
          profileUrl={creator.profileUrl}
          handle={creator.handle}
          className="mt-12"
        />
      </Section>

      <DiscountTables takeover={takeover} />

      <Section>
        <SectionHeading
          eyebrow="Included in every booking"
          title="What you get for the money"
        />
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          <TrustItem title="Exclusivity for your whole term">
            Your placement is yours alone. No rotation, no sharing, and no
            competitor in the slot next to you.
          </TrustItem>
          <TrustItem title="A real invoice">
            Dodo Payments acts as merchant of record and issues a proper tax
            invoice you can put through your books.
          </TrustItem>
          <TrustItem title="Campaign tracking">
            A private campaign page with your dates, status history and
            performance metrics for the run.
          </TrustItem>
          <TrustItem title="No auto-renewal">
            One payment covers the term you chose. Nothing recurs unless you
            deliberately book again.
          </TrustItem>
        </div>

        <div className="mt-12 text-center">
          <ButtonLink href="/book" size="lg">
            Book a placement
            <ButtonArrow />
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
