"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button, Card } from "@/components/ui";
import { OrderSummary } from "@/components/book/order-summary";
import { FormFields, type FormValues } from "@/components/book/form-fields";
import { SlotPicker } from "@/components/book/slot-picker";
import { TermPicker } from "@/components/book/term-picker";
import type {
  BookablePlacement,
  QuoteResponse,
} from "@/components/book/types";
import { formatMoney } from "@/lib/format";
import { isLaunchTerm } from "@/lib/domain";
import { LAUNCH_SPECIAL } from "@/lib/pricing";

/**
 * The booking flow.
 *
 * Responsibilities:
 *  - let the advertiser pick placements, a term and a start date
 *  - re-fetch availability whenever the term or start date changes
 *  - re-price server-side on every change (client arithmetic is never trusted)
 *  - submit, then hand off to the hosted Dodo checkout
 */

const EMPTY_FORM: FormValues = {
  advertiserName: "",
  advertiserEmail: "",
  brandName: "",
  targetUrl: "",
  assetUrl: "",
  notes: "",
};

export interface BookingFormProps {
  creatorSlug: string;
  placements: BookablePlacement[];
  promoPostPriceCents: number;
  /** Slot keys pre-selected from the `?slots=` query parameter. */
  initialSlots: string[];
  /** Pre-tick the promo-post add-on (from `?promo=1`, used by the takeover tier). */
  initialPromoPost?: boolean;
  /** Initial term in months; `0` is the launch special (from `?term=launch`). */
  initialMonths?: number;
  /** Earliest bookable date, `YYYY-MM-DD`. */
  minStartDate: string;
  paymentsConfigured: boolean;
}

export function BookingForm({
  creatorSlug,
  placements: initialPlacements,
  promoPostPriceCents,
  initialSlots,
  initialPromoPost = false,
  initialMonths = 1,
  minStartDate,
  paymentsConfigured,
}: BookingFormProps) {
  const sellable = useMemo(
    () => initialPlacements.filter((p) => p.kind !== "PROMO_POST"),
    [initialPlacements],
  );

  const [placements, setPlacements] = useState(sellable);
  const [selected, setSelected] = useState<string[]>(() =>
    initialSlots.filter((key) =>
      sellable.some((p) => p.slotKey === key && p.available),
    ),
  );
  const [months, setMonths] = useState(initialMonths);
  const [startDate, setStartDate] = useState(minStartDate);
  const [includePromoPost, setIncludePromoPost] = useState(initialPromoPost);

  // The launch special only covers the bio link on its own. If the selection
  // grows beyond that, fall back to the standard monthly term.
  const launchEligible =
    LAUNCH_SPECIAL.active &&
    selected.length === 1 &&
    selected[0] === LAUNCH_SPECIAL.slotKey;
  const launch = isLaunchTerm(months);
  const effectivePromo = includePromoPost && !launch;

  useEffect(() => {
    if (launch && selected.length > 0 && !launchEligible) setMonths(1);
  }, [launch, launchEligible, selected.length]);

  const [form, setForm] = useState<FormValues>(EMPTY_FORM);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // ---- Availability: refetch whenever the term or start date changes -------
  useEffect(() => {
    const controller = new AbortController();

    async function loadAvailability() {
      try {
        const params = new URLSearchParams({
          creatorSlug,
          months: String(months),
          startDate,
        });
        const response = await fetch(`/api/availability?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          placements: Record<
            string,
            { available: boolean; nextAvailableFrom: string | null }
          >;
        };

        setPlacements((current) =>
          current.map((placement) => {
            const info = data.placements[placement.slotKey];
            return info
              ? {
                  ...placement,
                  available: info.available,
                  nextAvailableFrom: info.nextAvailableFrom,
                }
              : placement;
          }),
        );

        // Drop any selection that just became unavailable for the new term.
        setSelected((current) =>
          current.filter((key) => data.placements[key]?.available !== false),
        );
      } catch {
        // Aborted or offline: keep the previous availability on screen.
      }
    }

    loadAvailability();
    return () => controller.abort();
  }, [creatorSlug, months, startDate]);

  // ---- Pricing: always server-authoritative --------------------------------
  useEffect(() => {
    if (selected.length === 0) {
      setQuote(null);
      return;
    }

    const controller = new AbortController();
    setQuoting(true);

    async function loadQuote() {
      try {
        const response = await fetch("/api/quote", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            creatorSlug,
            slotKeys: selected,
            months,
            includePromoPost: effectivePromo,
          }),
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as { pricing: QuoteResponse };
        setQuote(data.pricing);
      } catch {
        // Ignore aborts caused by rapid successive changes.
      } finally {
        setQuoting(false);
      }
    }

    loadQuote();
    return () => controller.abort();
  }, [creatorSlug, selected, months, effectivePromo]);

  const toggleSlot = useCallback((slotKey: string) => {
    setSelected((current) =>
      current.includes(slotKey)
        ? current.filter((key) => key !== slotKey)
        : [...current, slotKey],
    );
  }, []);

  const updateField = useCallback((key: keyof FormValues, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (selected.length === 0) {
      setError("Select at least one placement to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          creatorSlug,
          slotKeys: selected,
          months,
          startDate,
          includePromoPost: effectivePromo,
          advertiserName: form.advertiserName,
          advertiserEmail: form.advertiserEmail,
          brandName: form.brandName,
          targetUrl: form.targetUrl,
          assetUrl: form.assetUrl || undefined,
          notes: form.notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        if (data.fields) setFieldErrors(data.fields);
        setSubmitting(false);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Payments not configured: confirm the reservation instead.
      window.location.href = `/checkout/return?reference=${encodeURIComponent(
        data.reference,
      )}&pending=1`;
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"
    >
      <div className="space-y-6">
        <SlotPicker
          placements={placements}
          selected={selected}
          onToggle={toggleSlot}
        />

        <TermPicker
          months={months}
          onMonthsChange={setMonths}
          startDate={startDate}
          minStartDate={minStartDate}
          onStartDateChange={setStartDate}
          includePromoPost={includePromoPost}
          onIncludePromoPostChange={setIncludePromoPost}
          promoPostPriceCents={promoPostPriceCents}
          launchEligible={launchEligible}
        />

        <FormFields values={form} errors={fieldErrors} onChange={updateField} />
      </div>

      {/*
        Phones: a sticky running total that jumps to the summary (and its
        submit button). Display only: it reads the server quote already in
        state and never submits by itself.
      */}
      {quote && selected.length > 0 ? (
        <a
          href="#order-summary"
          className="sticky bottom-3 z-30 flex items-center justify-between gap-3 rounded-2xl border border-line bg-foreground px-4 py-3 text-background shadow-[var(--shadow-pop)] lg:hidden"
        >
          <span className="text-sm">
            <span className="block text-xs opacity-70">Total due today</span>
            <span className="text-lg font-bold tabular-nums">
              {formatMoney(quote.totalCents)}
            </span>
          </span>
          <span className="text-sm font-semibold">Review &amp; pay &darr;</span>
        </a>
      ) : null}

      <div id="order-summary" className="lg:sticky lg:top-24 lg:h-fit">
        <Card className="shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Order summary</h2>
            {selected.length > 0 ? (
              <span className="text-xs tabular-nums text-muted">
                {selected.length} placement{selected.length === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
          <div className="mt-5">
            <OrderSummary quote={quote} loading={quoting} />
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-danger/30 bg-danger-wash px-4 py-3 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            disabled={submitting || quoting || selected.length === 0}
          >
            {submitting
              ? "Redirecting to checkout…"
              : quote
                ? `Continue · ${formatMoney(quote.totalCents)}`
                : "Continue to checkout"}
          </Button>

          {paymentsConfigured ? (
            <p className="mt-3 flex gap-2 text-xs leading-relaxed text-muted">
              <svg
                aria-hidden
                width="14"
                height="14"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="mt-px shrink-0 text-success"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 0 0-4.5 4.5V8H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm2.5 7V5.5a2.5 2.5 0 0 0-5 0V8h5Z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Secure checkout by Dodo Payments. Card, wallet and crypto
                accepted. You will receive an invoice by email.
              </span>
            </p>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-warning">
              Payments are not configured on this deployment. Your booking will
              be reserved and a payment link emailed to you.
            </p>
          )}
        </Card>
      </div>
    </form>
  );
}
