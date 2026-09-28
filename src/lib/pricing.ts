import {
  BIO_LINK_SLOT_KEY,
  LAUNCH_TERM_DAYS,
  LAUNCH_TERM_MONTHS,
  PROMO_POST_SLOT_KEY,
  isLaunchTerm,
} from "@/lib/domain";

/**
 * Pricing engine.
 *
 * Every amount is an integer number of USD cents, with no floating point money.
 * The rules are intentionally declarative so the checkout API, the UI estimate
 * and the stored invoice breakdown all derive from this single source of truth.
 *
 * Rate card (list, per month): half of the cover photo $99, product link in
 * bio $89. Longer terms lower the monthly rate; see TERM_DISCOUNT_TIERS.
 */

/**
 * Launch special: the product link in bio for two weeks at a flat price.
 * Flip `active` to false to retire the offer everywhere (UI and checkout).
 */
export const LAUNCH_SPECIAL = {
  active: true,
  /** Only this placement can be booked on the launch special. */
  slotKey: BIO_LINK_SLOT_KEY,
  priceCents: 2_900,
  days: LAUNCH_TERM_DAYS,
  /** Sentinel term value used in place of a month count. */
  months: LAUNCH_TERM_MONTHS,
  label: "Launch special · 2 weeks",
} as const;

/** Volume discount: longer commitments unlock a bigger percentage off. */
export interface TermDiscountTier {
  /** Minimum number of months required to unlock the tier. */
  minMonths: number;
  /** Discount in basis points (500 = 5%). */
  bps: number;
  label: string;
}

/**
 * Longer commitments unlock a bigger percentage off. The discounted monthly
 * rate is rounded to a whole dollar (see `termMonthlyRateCents`), so the rate
 * card reads cleanly:
 *
 *   Cover half  $99 → 3 mo $89 · 6 mo $79 · 12 mo $69
 *   Bio link    $89 → 3 mo $80 · 6 mo $71 · 12 mo $62
 */
export const TERM_DISCOUNT_TIERS: readonly TermDiscountTier[] = [
  { minMonths: 12, bps: 3000, label: "12 months · 30% off" },
  { minMonths: 6, bps: 2000, label: "6 months · 20% off" },
  { minMonths: 3, bps: 1000, label: "3 months · 10% off" },
  { minMonths: 1, bps: 0, label: "Monthly · standard rate" },
];

/** Monthly rate after the term discount, rounded to a whole dollar. */
export function termMonthlyRateCents(
  priceMonthlyCents: number,
  months: number,
): number {
  const bps = termDiscountBps(months);
  if (bps === 0) return priceMonthlyCents;
  return (
    Math.round((priceMonthlyCents * (10_000 - bps)) / 10_000 / 100) * 100
  );
}

/**
 * Bundle discount when a booking covers more than one placement at once.
 * Three sellable placements exist (two cover halves + the bio link), so the
 * top tier is the full profile.
 */
export const BUNDLE_DISCOUNT_TIERS: readonly { minSlots: number; bps: number }[] = [
  { minSlots: 3, bps: 1000 },
  { minSlots: 2, bps: 500 },
];

/** Discount applied to the promo-post add-on when bought with a placement. */
export const PROMO_ADDON_DISCOUNT_BPS = 3000;

export function termDiscountBps(months: number): number {
  if (isLaunchTerm(months)) return 0;
  return (
    TERM_DISCOUNT_TIERS.find((tier) => months >= tier.minMonths)?.bps ?? 0
  );
}

export function bundleDiscountBps(slotCount: number): number {
  return (
    BUNDLE_DISCOUNT_TIERS.find((tier) => slotCount >= tier.minSlots)?.bps ?? 0
  );
}

/** Rounds to the nearest cent, avoiding float drift from bps math. */
function applyBps(amountCents: number, bps: number): number {
  return Math.round((amountCents * bps) / 10_000);
}

export interface PricingLineItem {
  slotKey: string;
  label: string;
  /** Monthly list price for this line. */
  unitPriceCents: number;
  months: number;
  /** unitPriceCents * months */
  subtotalCents: number;
}

export interface PricingInput {
  items: {
    slotKey: string;
    label: string;
    priceMonthlyCents: number;
  }[];
  months: number;
  /** Add a dedicated promotional post to the order. */
  includePromoPost: boolean;
  /** List price of a standalone promo post. */
  promoPostPriceCents: number;
}

export interface PricingQuote {
  lineItems: PricingLineItem[];
  /** Sum of all placement line items before discounts. */
  placementSubtotalCents: number;
  termDiscountBps: number;
  termDiscountCents: number;
  bundleDiscountBps: number;
  bundleDiscountCents: number;
  /** termDiscountCents + bundleDiscountCents */
  discountCents: number;
  /** Promo post list price. */
  promoListCents: number;
  /** Savings on the promo post add-on. */
  promoDiscountCents: number;
  /** What the advertiser actually pays for the promo post. */
  promoAddonCents: number;
  includesPromoPost: boolean;
  /** Term in months; `0` means the two-week launch special. */
  months: number;
  /** True when priced as the two-week launch special. */
  isLaunchSpecial: boolean;
  /** Final charge: discounted placements + discounted promo add-on. */
  totalCents: number;
  /** Total the advertiser saved versus list price. */
  totalSavingsCents: number;
  /** List price with no discounts, for "was / now" display. */
  listTotalCents: number;
}

/**
 * Computes a complete, auditable quote.
 *
 * Discount order:
 *  1. Placement subtotal = sum(monthly price x months)
 *  2. Term discount: each line drops to its whole-dollar term rate
 *  3. Bundle discount on the subtotal (more slots = larger discount)
 *  4. Promo post add-on, discounted because it is bought alongside a placement
 *
 * Launch special (`months === 0`): only the bio link, charged the flat
 * launch price for two weeks, with no term or bundle discount. Callers must
 * reject any other placement before quoting (see `quoteForRequest`).
 */
export function quote(input: PricingInput): PricingQuote {
  const launch = isLaunchTerm(Math.trunc(input.months));
  const months = launch ? LAUNCH_TERM_MONTHS : Math.max(1, Math.trunc(input.months));

  const lineItems: PricingLineItem[] = input.items
    .filter((item) => item.slotKey !== PROMO_POST_SLOT_KEY)
    .map((item) => ({
      slotKey: item.slotKey,
      label: launch ? `${item.label} · ${LAUNCH_SPECIAL.label}` : item.label,
      unitPriceCents: launch ? LAUNCH_SPECIAL.priceCents : item.priceMonthlyCents,
      months,
      subtotalCents: launch
        ? LAUNCH_SPECIAL.priceCents
        : item.priceMonthlyCents * months,
    }));

  const placementSubtotalCents = lineItems.reduce(
    (sum, item) => sum + item.subtotalCents,
    0,
  );

  const tBps = termDiscountBps(months);
  const bBps = launch ? 0 : bundleDiscountBps(lineItems.length);

  const termDiscountCents = launch
    ? 0
    : lineItems.reduce(
        (sum, item) =>
          sum +
          (item.unitPriceCents -
            termMonthlyRateCents(item.unitPriceCents, months)) *
            months,
        0,
      );
  const bundleDiscountCents = applyBps(placementSubtotalCents, bBps);
  const discountCents = termDiscountCents + bundleDiscountCents;

  const promoListCents = input.includePromoPost ? input.promoPostPriceCents : 0;
  const promoDiscountCents = input.includePromoPost
    ? applyBps(promoListCents, PROMO_ADDON_DISCOUNT_BPS)
    : 0;
  const promoAddonCents = promoListCents - promoDiscountCents;

  const totalCents =
    placementSubtotalCents - discountCents + promoAddonCents;

  return {
    lineItems,
    placementSubtotalCents,
    termDiscountBps: tBps,
    termDiscountCents,
    bundleDiscountBps: bBps,
    bundleDiscountCents,
    discountCents,
    promoListCents,
    promoDiscountCents,
    promoAddonCents,
    includesPromoPost: input.includePromoPost,
    months,
    isLaunchSpecial: launch,
    totalCents,
    totalSavingsCents: discountCents + promoDiscountCents,
    listTotalCents: placementSubtotalCents + promoListCents,
  };
}
