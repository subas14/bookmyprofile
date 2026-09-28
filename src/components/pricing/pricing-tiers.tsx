"use client";

import { useState } from "react";

import { cx } from "@/components/ui";
import { TierCard } from "@/components/pricing/tier-card";
import { BIO_LINK_MAX_CONCURRENT } from "@/lib/domain";
import { costPerMille, formatMoney } from "@/lib/format";
import {
  PROMO_ADDON_DISCOUNT_BPS,
  TERM_DISCOUNT_TIERS,
  quote,
  termMonthlyRateCents,
  type PricingQuote,
} from "@/lib/pricing";

export interface PricingPlacement {
  slotKey: string;
  kind: string;
  label: string;
  priceMonthlyCents: number;
  available: boolean;
  /** Free concurrent lines (relevant to the multi-brand bio link). */
  openCount?: number;
  maxConcurrent?: number;
}

/**
 * Three-tier pricing with a term toggle.
 *
 * Tiers are derived from the real inventory rather than hard-coded:
 *   1. Any single cover half
 *   2. Product link in bio  (highlighted: highest intent, up to 3 at once)
 *   3. Full takeover: every placement + the promo post
 *
 * Every figure comes from `quote()`, the same engine checkout uses, so this
 * page can never show a total that differs from what is charged.
 */
export function PricingTiers({
  placements,
  promoPostPriceCents,
  monthlyImpressions,
}: {
  placements: PricingPlacement[];
  promoPostPriceCents: number;
  monthlyImpressions: number;
}) {
  const terms = [...TERM_DISCOUNT_TIERS].sort(
    (a, b) => a.minMonths - b.minMonths,
  );
  const [months, setMonths] = useState<number>(1);

  const covers = placements.filter((p) => p.kind === "COVER_SLOT");
  const cover = [...covers].sort(
    (a, b) => a.priceMonthlyCents - b.priceMonthlyCents,
  )[0];
  const bio = placements.find((p) => p.kind === "BIO_LINK");
  const openCover = covers.filter((p) => p.available).length;

  const toQuote = (items: PricingPlacement[], includePromo: boolean) =>
    quote({
      items: items.map((p) => ({
        slotKey: p.slotKey,
        label: p.label,
        priceMonthlyCents: p.priceMonthlyCents,
      })),
      months,
      includePromoPost: includePromo,
      promoPostPriceCents,
    });

  /** Effective monthly price after discounts (placements only). */
  const perMonth = (q: PricingQuote) =>
    Math.round((q.placementSubtotalCents - q.discountCents) / q.months);

  const coverQuote = cover ? toQuote([cover], false) : null;
  const bioQuote = bio ? toQuote([bio], false) : null;
  const takeover = toQuote(placements, true);
  const activeTerm = terms.find((t) => t.minMonths === months);
  const topTerm = terms[terms.length - 1];

  const bioMax = bio?.maxConcurrent ?? BIO_LINK_MAX_CONCURRENT;
  const bioOpen = bio?.openCount ?? (bio?.available ? bioMax : 0);

  return (
    <div>
      {/*
        The term toggle sticks under the header while the card rail below is
        scrolled, so the price the reader is comparing never scrolls out of
        view. `top-16` matches the h-16 sticky header.
      */}
      <div className="sticky top-16 z-30 -mx-5 bg-background px-5 py-3 sm:-mx-8 sm:px-8">
        <TermToggle terms={terms} months={months} onChange={setMonths} />
        <p className="mt-3 text-center text-xs text-muted">
          {activeTerm && activeTerm.bps > 0
            ? `${activeTerm.bps / 100}% term discount applied. Bundle discounts stack on top.`
            : `Pay yearly and save ${topTerm.bps / 100}%: ${
                bio
                  ? formatMoney(
                      termMonthlyRateCents(bio.priceMonthlyCents, topTerm.minMonths),
                    )
                  : ""
              }/month instead of ${bio ? formatMoney(bio.priceMonthlyCents) : ""}.`}
        </p>
      </div>

      {/*
        On a phone the three tiers are wider than the viewport, so they become a
        snap carousel: swipe and each card settles centred rather than landing
        between two plans. The rail carries vertical padding because it has to
        clip on the cross axis, and the "Most popular" badge and the hover lift
        both sit outside the card's box. From `lg` up it is a plain three-up grid.
      */}
      <div className="bmp-snap-rail mt-6 grid auto-cols-[minmax(17.5rem,85%)] grid-flow-col gap-5 px-1.5 py-4 lg:mt-12 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-3 lg:items-stretch lg:px-0 lg:py-0">
        {cover && coverQuote ? (
          <TierCard
            eyebrow="Cover half"
            title="Half of the cover photo"
            description="Your logo and tagline across one full half of the cover image, left or right. Seen by everyone who opens the profile."
            perMonthCents={perMonth(coverQuote)}
            listMonthlyCents={cover.priceMonthlyCents}
            totalCents={coverQuote.totalCents}
            months={months}
            cpm={costPerMille(perMonth(coverQuote), monthlyImpressions)}
            availability={
              openCover > 0
                ? `${openCover} of ${covers.length} halves open`
                : "Both halves booked"
            }
            available={openCover > 0}
            features={[
              "Exclusive: one brand per half",
              "Persistent, visible every day of your term",
              "Desktop and mobile",
              "Creative approved with you before going live",
            ]}
            href={`/book?slots=${cover.slotKey}`}
          />
        ) : null}

        {bio && bioQuote ? (
          <TierCard
            highlighted
            eyebrow="Product link in bio"
            title="Your product, one tap away"
            description={`Your product URL and a line of copy in the profile bio. The bio holds up to ${bioMax} product links. You get your own line for the whole term.`}
            perMonthCents={perMonth(bioQuote)}
            listMonthlyCents={bio.priceMonthlyCents}
            totalCents={bioQuote.totalCents}
            months={months}
            cpm={costPerMille(perMonth(bioQuote), monthlyImpressions)}
            availability={
              bioOpen > 0
                ? `${bioOpen} of ${bioMax} links open`
                : "All links booked"
            }
            available={bioOpen > 0}
            features={[
              "Highest-intent placement on the profile",
              "Your own line, never rotated or shared",
              "Short line of copy, agreed together",
              "Click tracking on your campaign page",
            ]}
            href={`/book?slots=${bio.slotKey}`}
          />
        ) : null}

        <TierCard
          eyebrow="Full takeover"
          title="Every placement + promo post"
          description="Both halves of the cover, a product link in the bio, and a dedicated post in my voice. The biggest bundle discount applies."
          perMonthCents={perMonth(takeover)}
          listMonthlyCents={takeover.placementSubtotalCents / months}
          totalCents={takeover.totalCents}
          months={months}
          cpm={costPerMille(perMonth(takeover), monthlyImpressions)}
          availability={
            openCover === covers.length && bioOpen > 0
              ? "All placements open"
              : "Some placements booked. Check dates"
          }
          available={openCover === covers.length && bioOpen > 0}
          features={[
            `${takeover.bundleDiscountBps / 100}% bundle discount, stacked on term`,
            `Promo post at ${PROMO_ADDON_DISCOUNT_BPS / 100}% off (${formatMoney(
              takeover.promoAddonCents,
            )})`,
            "No competitor on the cover",
            `Save ${formatMoney(takeover.totalSavingsCents)} vs list`,
          ]}
          href={`/book?slots=${placements.map((p) => p.slotKey).join(",")}&promo=1`}
          promoNote
        />
      </div>
    </div>
  );
}

function TermToggle({
  terms,
  months,
  onChange,
}: {
  terms: { minMonths: number; bps: number }[];
  months: number;
  onChange: (months: number) => void;
}) {
  return (
    <div className="flex justify-center">
      <div
        role="tablist"
        aria-label="Term length"
        className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1"
      >
        {terms.map((tier) => {
          const selected = tier.minMonths === months;
          return (
            <button
              key={tier.minMonths}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tier.minMonths)}
              className={cx(
                "bmp-btn bmp-option rounded-full px-4 py-2 text-sm font-semibold",
                selected
                  ? "bg-foreground text-background"
                  : "text-muted hover:text-foreground",
              )}
            >
              {tier.minMonths} mo
              {tier.bps > 0 ? (
                <span
                  className={cx(
                    "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                    selected
                      ? "bg-background/15 text-background"
                      : "bg-success-wash text-success",
                  )}
                >
                  −{tier.bps / 100}%
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
