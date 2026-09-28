import { formatMoney, formatTerm } from "@/lib/format";
import type { QuoteResponse } from "@/components/book/types";

/**
 * Live order summary.
 *
 * The figures come from the server-side pricing engine (via /api/quote), never
 * from client-side arithmetic, so what is displayed is exactly what is charged.
 */
export function OrderSummary({
  quote,
  loading,
}: {
  quote: QuoteResponse | null;
  loading: boolean;
}) {
  if (!quote || quote.lineItems.length === 0) {
    return (
      <p className="text-sm text-muted">
        Select at least one placement to see your total.
      </p>
    );
  }

  return (
    <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <ul className="space-y-2.5 text-sm">
        {quote.lineItems.map((item) => (
          <li key={item.slotKey} className="flex justify-between gap-3">
            <span className="text-muted">
              {item.label}
              {quote.isLaunchSpecial ? null : (
                <span className="ml-1 text-xs">
                  ({formatMoney(item.unitPriceCents)} × {item.months})
                </span>
              )}
            </span>
            <span className="shrink-0 tabular-nums">
              {formatMoney(item.subtotalCents)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Subtotal</dt>
          <dd className="tabular-nums">
            {formatMoney(quote.placementSubtotalCents)}
          </dd>
        </div>

        {quote.termDiscountCents > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">
              {quote.months}-month term ({quote.termDiscountBps / 100}% off)
            </dt>
            <dd className="tabular-nums text-success">
              −{formatMoney(quote.termDiscountCents)}
            </dd>
          </div>
        ) : null}

        {quote.bundleDiscountCents > 0 ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">
              Bundle of {quote.lineItems.length} ({quote.bundleDiscountBps / 100}
              % off)
            </dt>
            <dd className="tabular-nums text-success">
              −{formatMoney(quote.bundleDiscountCents)}
            </dd>
          </div>
        ) : null}

        {quote.includesPromoPost ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">
              Promo post
              <span className="ml-1 text-xs line-through opacity-60">
                {formatMoney(quote.promoListCents)}
              </span>
            </dt>
            <dd className="tabular-nums">
              {formatMoney(quote.promoAddonCents)}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-line pt-4">
        <div>
          <p className="text-sm text-muted">Total due today</p>
          {quote.totalSavingsCents > 0 ? (
            <p className="mt-0.5 text-xs text-success">
              You save {formatMoney(quote.totalSavingsCents)}
            </p>
          ) : null}
        </div>
        <p className="text-2xl font-semibold tabular-nums">
          {formatMoney(quote.totalCents)}
        </p>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        One-off payment covering the full {formatTerm(quote.months)}. No
        auto-renewal, no hidden fees.
      </p>
    </div>
  );
}
