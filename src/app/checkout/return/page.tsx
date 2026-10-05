import type { Metadata } from "next";
import Link from "next/link";

import { ButtonLink, Card, Section } from "@/components/ui";
import { OrderReceipt } from "@/components/checkout/order-receipt";
import { CryptoPayment } from "@/components/checkout/crypto-payment";
import { findOrderByReference } from "@/server/bookings";
import { publicChainOptions } from "@/lib/crypto-config";

export const metadata: Metadata = {
  title: "Booking confirmed",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Post-checkout landing page.
 *
 * Dodo redirects here after payment, but confirmation arrives asynchronously by
 * webhook, so this page reports the current state rather than assuming success.
 * The reference is always shown so the advertiser has something to quote even
 * while the webhook is still in flight.
 */
export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; pending?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference?.trim().toUpperCase();
  const paymentsPending = params.pending === "1";

  // Looked up without an email filter because the reference came from our own
  // redirect, and only non-sensitive summary fields are rendered.
  const rows = reference ? await findOrderByReference(reference) : [];
  const order = rows[0];
  const totalCents = rows.reduce((sum, row) => sum + row.totalAmountCents, 0);
  const isPaid = rows.some((row) => row.paidAt !== null);

  // Offer direct crypto settlement when the order is still unpaid and at least
  // one chain is configured. Addresses come from the server config, never the
  // client.
  const cryptoChains = order && !isPaid ? publicChainOptions() : [];

  return (
    <Section className="py-20">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          {/* Green check only once payment is actually recorded; a neutral
              clock while the webhook is still in flight. */}
          <span
            aria-hidden
            className={
              isPaid
                ? "mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-success/30 bg-success-wash text-success"
                : "mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-warning/30 bg-warning-wash text-warning"
            }
          >
            {isPaid ? (
              <svg width="26" height="26" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
            )}
          </span>

          <h1 className="mt-6 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {paymentsPending
              ? "Your placement is reserved."
              : isPaid
                ? "Payment received. You're booked."
                : "Thank you, we're confirming your payment."}
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted">
            {paymentsPending
              ? "Your slot is held. A payment link is on its way to your email. The placement is confirmed once payment clears."
              : isPaid
                ? "Your booking is now in review. I will set the placement live on your start date and email you when it is up."
                : "Payment confirmations can take a few moments to arrive. This page shows the final status once it does, so your reference is safe to quote in the meantime."}
          </p>
        </div>

        {order ? (
          <OrderReceipt
            reference={order.reference}
            status={order.status}
            brandName={order.brandName}
            placementLabels={rows.map((row) => row.placement.label)}
            months={order.months}
            startDate={order.startDate}
            endDate={order.endDate}
            includesPromoPost={order.includesPromoPost}
            totalCents={totalCents}
            isPaid={isPaid}
          />
        ) : null}

        {order && cryptoChains.length > 0 ? (
          <CryptoPayment
            reference={order.reference}
            amountCents={totalCents}
            chains={cryptoChains}
          />
        ) : null}

        {!order ? (
          <Card className="mt-10 text-center">
            <p className="text-sm text-muted">
              {reference
                ? `We could not find a booking for reference ${reference}. If you have just paid, wait a moment and refresh.`
                : "No booking reference was supplied."}
            </p>
            <div className="mt-6">
              <Link
                href="/campaigns"
                className="text-sm font-semibold text-accent transition-colors hover:text-foreground"
              >
                Look up a campaign &rarr;
              </Link>
            </div>
          </Card>
        ) : null}

        {order ? (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink
              href={`/campaigns?reference=${encodeURIComponent(order.reference)}`}
            >
              Track this campaign
            </ButtonLink>
            <ButtonLink href="/" variant="secondary">
              Back to home
            </ButtonLink>
          </div>
        ) : null}
      </div>
    </Section>
  );
}
