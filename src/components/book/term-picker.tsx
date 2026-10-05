"use client";

import { Card, cx } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import { isLaunchTerm } from "@/lib/domain";
import { StepHeader } from "@/components/book/step-header";
import {
  LAUNCH_SPECIAL,
  PROMO_ADDON_DISCOUNT_BPS,
  TERM_DISCOUNT_TIERS,
} from "@/lib/pricing";

const TERM_OPTIONS = [1, 3, 6, 12];

/** Step 2: term length, start date, and the promo-post add-on. */
export function TermPicker({
  months,
  onMonthsChange,
  startDate,
  minStartDate,
  onStartDateChange,
  includePromoPost,
  onIncludePromoPostChange,
  promoPostPriceCents,
  launchEligible,
}: {
  months: number;
  onMonthsChange: (value: number) => void;
  startDate: string;
  minStartDate: string;
  onStartDateChange: (value: string) => void;
  includePromoPost: boolean;
  onIncludePromoPostChange: (value: boolean) => void;
  promoPostPriceCents: number;
  /** True when the selection is only the bio link, so the launch special applies. */
  launchEligible: boolean;
}) {
  // Mirrors the server-side promo discount so the preview price is consistent.
  const promoDiscounted =
    promoPostPriceCents -
    Math.round((promoPostPriceCents * PROMO_ADDON_DISCOUNT_BPS) / 10_000);
  const launch = isLaunchTerm(months);
  const discountFor = (option: number) =>
    TERM_DISCOUNT_TIERS.find((tier) => option >= tier.minMonths)?.bps ?? 0;

  return (
    <Card>
      <StepHeader
        step={2}
        title="Choose your term"
        description="Longer terms receive a bigger automatic discount."
      />

      {LAUNCH_SPECIAL.active ? (
        <button
          type="button"
          onClick={() => launchEligible && onMonthsChange(LAUNCH_SPECIAL.months)}
          aria-pressed={launch}
          disabled={!launchEligible}
          className={cx(
            "mt-5 flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-left ring-1",
            launch
              ? "bg-accent text-accent-fg ring-accent transition-colors"
              : launchEligible
                ? "bmp-option border-dashed bg-accent-wash text-foreground ring-accent/40 hover:ring-accent"
                : "cursor-not-allowed bg-panel text-faint ring-line opacity-70",
          )}
        >
          <span>
            <span className="flex items-center gap-2 text-sm font-semibold">
              Launch special
              <span
                className={cx(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  launch ? "bg-accent-fg/15" : "bg-accent text-accent-fg",
                )}
              >
                2 weeks
              </span>
            </span>
            <span
              className={cx(
                "mt-0.5 block text-xs",
                launch ? "text-accent-fg/80" : "text-muted",
              )}
            >
              {launchEligible
                ? "Try the product link in bio for 14 days."
                : "Select only the product link in bio to use this offer."}
            </span>
          </span>
          <span className="shrink-0 text-xl font-extrabold tabular-nums">
            {formatMoney(LAUNCH_SPECIAL.priceCents)}
          </span>
        </button>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {TERM_OPTIONS.map((option) => {
          const bps = discountFor(option);
          const active = months === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onMonthsChange(option)}
              aria-pressed={active}
              className={cx(
                "rounded-xl px-4 py-3 text-sm font-semibold ring-1",
                active
                  ? "bg-foreground text-background ring-foreground transition-colors"
                  : "bmp-option bg-surface text-muted ring-line hover:text-foreground hover:ring-line-strong",
              )}
            >
              {option} month{option === 1 ? "" : "s"}
              {bps > 0 ? (
                <span
                  className={cx(
                    "ml-1.5 text-[11px] font-bold tabular-nums",
                    active ? "text-background/75" : "text-success",
                  )}
                >
                  −{bps / 100}%
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <label
          htmlFor="startDate"
          className="block text-sm font-medium text-foreground"
        >
          Start date
        </label>
        <input
          id="startDate"
          type="date"
          value={startDate}
          min={minStartDate}
          onChange={(event) => onStartDateChange(event.target.value)}
          className="mt-2 w-full rounded-xl bg-surface px-4 py-2.5 text-sm ring-1 ring-line transition-shadow focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <p className="mt-2 text-xs text-muted">
          Availability updates automatically for the dates you pick.
        </p>
      </div>

      <label
        className={cx(
          "mt-6 flex items-start gap-3 rounded-xl p-4 transition-colors",
          launch
            ? "cursor-not-allowed bg-panel opacity-55 ring-1 ring-line"
            : includePromoPost
              ? "cursor-pointer bg-accent-wash ring-2 ring-accent"
              : "cursor-pointer bg-surface ring-1 ring-line hover:ring-line-strong",
        )}
      >
        <input
          type="checkbox"
          checked={includePromoPost && !launch}
          disabled={launch}
          onChange={(event) => onIncludePromoPostChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
        />
        <span>
          <span className="block text-sm font-medium">
            Add a dedicated promo post{" "}
            <span className="text-accent">
              ({PROMO_ADDON_DISCOUNT_BPS / 100}% off)
            </span>
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            {formatMoney(promoDiscounted)} instead of{" "}
            {formatMoney(promoPostPriceCents)} when bundled with a placement.
            {launch ? " Not available with the launch special." : ""}
          </span>
        </span>
      </label>
    </Card>
  );
}
