/**
 * Pricing engine self-check.
 *
 * Asserts the published rate card and discount rules produce the exact totals
 * advertised on the pricing page. Run with:
 *   node --experimental-strip-types scripts/verify-pricing.ts
 */
import {
  LAUNCH_SPECIAL,
  quote,
  termMonthlyRateCents,
} from "../src/lib/pricing.ts";

let failures = 0;

function check(label: string, actual: number, expected: number) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label}\n      expected ${expected}, got ${actual}`,
  );
}

const cover = (key: string) => ({
  slotKey: key,
  label: key,
  priceMonthlyCents: 9_900,
});
const bio = { slotKey: "bio-link", label: "Bio link", priceMonthlyCents: 8_900 };
const PROMO = 24_900;

const one = (item: typeof bio, months: number) =>
  quote({ items: [item], months, includePromoPost: false, promoPostPriceCents: PROMO });

// 1. List prices, one month: cover half $99, bio link $89, no discounts.
const a = one(cover("cover-left"), 1);
check("1 cover half / 1 month = $99", a.totalCents, 9_900);
check("no term discount at 1 month", a.termDiscountCents, 0);
check("no bundle discount for 1 slot", a.bundleDiscountCents, 0);
check("bio link / 1 month = $89", one(bio, 1).totalCents, 8_900);

// 2. Whole-dollar monthly rate by term.
check("rate: cover 3 mo = $89", termMonthlyRateCents(9_900, 3), 8_900);
check("rate: cover 6 mo = $79", termMonthlyRateCents(9_900, 6), 7_900);
check("rate: cover 12 mo = $69", termMonthlyRateCents(9_900, 12), 6_900);
check("rate: bio 3 mo = $80", termMonthlyRateCents(8_900, 3), 8_000);
check("rate: bio 6 mo = $71", termMonthlyRateCents(8_900, 6), 7_100);
check("rate: bio 12 mo = $62", termMonthlyRateCents(8_900, 12), 6_200);

// 3. Term totals.
check("cover / 3 months = $267", one(cover("cover-left"), 3).totalCents, 26_700);
check("cover / 6 months = $474", one(cover("cover-left"), 6).totalCents, 47_400);
check("cover / 12 months = $828", one(cover("cover-left"), 12).totalCents, 82_800);
check("bio / 3 months = $240", one(bio, 3).totalCents, 24_000);
check("bio / 6 months = $426", one(bio, 6).totalCents, 42_600);
const y = one(bio, 12);
check("bio / 12 months subtotal", y.placementSubtotalCents, 106_800);
check("bio / 12 months term discount", y.termDiscountCents, 32_400);
check("bio / 12 months = $744 ($62/mo)", y.totalCents, 74_400);

// 4. Bundle discount: 2 slots unlocks 5%.
const d = quote({
  items: [cover("cover-left"), cover("cover-right")],
  months: 1,
  includePromoPost: false,
  promoPostPriceCents: PROMO,
});
check("2 cover halves subtotal", d.placementSubtotalCents, 19_800);
check("2-slot bundle discount = 5%", d.bundleDiscountCents, 990);
check("2 cover halves total", d.totalCents, 18_810);

// 5. Promo add-on is 30% off when bundled.
const e = quote({
  items: [bio],
  months: 1,
  includePromoPost: true,
  promoPostPriceCents: PROMO,
});
check("promo add-on discount = 30%", e.promoDiscountCents, 7_470);
check("promo add-on charged", e.promoAddonCents, 17_430);
check("bio + promo total", e.totalCents, 26_330);

// 6. Full takeover: 2 cover halves + bio, 12 months, with promo post.
//    Subtotal = (9900 + 9900 + 8900) x 12 = 344400
//    Term discount = (3000 + 3000 + 2700) x 12 = 104400
//    Bundle discount 10% (3 slots) = 34440
//    Promo = 24900 - 7470 = 17430
//    Total = 344400 - 104400 - 34440 + 17430 = 222990
const f = quote({
  items: [cover("cover-left"), cover("cover-right"), bio],
  months: 12,
  includePromoPost: true,
  promoPostPriceCents: PROMO,
});
check("takeover subtotal", f.placementSubtotalCents, 344_400);
check("takeover term discount", f.termDiscountCents, 104_400);
check("takeover bundle discount (10%)", f.bundleDiscountCents, 34_440);
check("takeover total", f.totalCents, 222_990);
check("takeover savings", f.totalSavingsCents, 146_310);

// 6b. Launch special: bio link, 2 weeks, flat $29, no discounts.
const l = one(bio, LAUNCH_SPECIAL.months);
check("launch special flagged", Number(l.isLaunchSpecial), 1);
check("launch special total = $29", l.totalCents, 2_900);
check("launch special has no term discount", l.termDiscountCents, 0);
check("launch special keeps months = 0", l.months, 0);

// 7. A promo-post slot key passed among the placements must not be double
//    charged as a placement line item.
const g = quote({
  items: [bio, { slotKey: "promo-post", label: "Promo", priceMonthlyCents: PROMO }],
  months: 1,
  includePromoPost: true,
  promoPostPriceCents: PROMO,
});
check("promo-post excluded from line items", g.lineItems.length, 1);
check("promo counted once only", g.totalCents, 26_330);

console.log(
  failures === 0
    ? "\nAll pricing checks passed."
    : `\n${failures} pricing check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
