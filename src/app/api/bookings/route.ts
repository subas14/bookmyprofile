import { NextResponse } from "next/server";

import { bookingRequestSchema, fieldErrors } from "@/lib/validation";
import {
  BookingError,
  attachCheckoutSession,
  createBooking,
} from "@/server/bookings";
import { createCheckoutSession, isPaymentsConfigured } from "@/server/payments";
import { formatMoney, formatTerm } from "@/lib/format";

/**
 * POST /api/bookings
 *
 * Creates a booking and returns a hosted Dodo Payments checkout URL.
 *
 * The booking is persisted first (status `PENDING_PAYMENT`) so a checkout that
 * is abandoned leaves an auditable record, and the webhook has a row to settle
 * against. Inventory is only consumed once payment is confirmed.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the highlighted fields", fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  let booking;
  try {
    booking = await createBooking(parsed.data);
  } catch (error) {
    if (error instanceof BookingError) {
      const status =
        error.code === "CREATOR_NOT_FOUND" || error.code === "PLACEMENT_NOT_FOUND"
          ? 404
          : error.code === "UNAVAILABLE"
            ? 409
            : 400;
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status },
      );
    }
    console.error("[api/bookings] create failed", error);
    return NextResponse.json(
      { error: "Could not create the booking" },
      { status: 500 },
    );
  }

  // Without Dodo credentials the booking still exists; the advertiser is told
  // to expect a manual payment link rather than being shown a broken checkout.
  if (!isPaymentsConfigured()) {
    return NextResponse.json(
      {
        reference: booking.reference,
        totalAmountCents: booking.totalAmountCents,
        pricing: booking.pricing,
        checkoutUrl: null,
        paymentsConfigured: false,
        message:
          "Booking reserved. Payments are not configured on this deployment, " +
          "so a payment link will be sent to your email.",
      },
      { status: 201 },
    );
  }

  try {
    const placementCount = booking.pricing.lineItems.length;
    const session = await createCheckoutSession({
      bookingId: booking.ids[0],
      reference: booking.reference,
      amountCents: booking.totalAmountCents,
      advertiserEmail: parsed.data.advertiserEmail,
      advertiserName: parsed.data.advertiserName,
      description:
        `${placementCount} placement${placementCount === 1 ? "" : "s"} · ` +
        `${formatTerm(booking.pricing.months)} · ` +
        formatMoney(booking.totalAmountCents),
    });

    await attachCheckoutSession(booking.reference, session.sessionId);

    return NextResponse.json(
      {
        reference: booking.reference,
        totalAmountCents: booking.totalAmountCents,
        pricing: booking.pricing,
        checkoutUrl: session.checkoutUrl,
        paymentsConfigured: true,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/bookings] checkout failed", error);
    // The booking row survives so it can be recovered or retried.
    return NextResponse.json(
      {
        reference: booking.reference,
        error:
          "Your booking was reserved but the payment session could not be " +
          "created. Quote your reference and we will send a payment link.",
      },
      { status: 502 },
    );
  }
}
