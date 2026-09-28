import { NextResponse } from "next/server";

import { verifyWebhook, type DodoWebhookEvent } from "@/server/payments";
import { markOrderFailed, markOrderPaid } from "@/server/bookings";

/**
 * POST /api/webhooks/dodo
 *
 * Dodo Payments webhook receiver (Standard Webhooks spec).
 *
 * Contract notes:
 *  - The raw request body is required for signature verification, so the body is
 *    read as text before any parsing.
 *  - Verification failures return 400 so Dodo retries with backoff.
 *  - Handler errors return 500 (also retried); successful handling returns 200.
 *  - Settlement is idempotent, so replayed deliveries are safe.
 */

/** Pulls the booking identifiers out of the event metadata. */
function extractIdentifiers(event: DodoWebhookEvent) {
  const metadata = event.data?.metadata ?? undefined;
  return {
    bookingId: metadata?.booking_id,
    reference: metadata?.booking_reference,
    paymentId: event.data?.payment_id,
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const webhookId = request.headers.get("webhook-id");
  const webhookTimestamp = request.headers.get("webhook-timestamp");
  const webhookSignature = request.headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return NextResponse.json(
      { error: "Missing webhook signature headers" },
      { status: 400 },
    );
  }

  let event: DodoWebhookEvent;
  try {
    event = verifyWebhook(rawBody, {
      "webhook-id": webhookId,
      "webhook-timestamp": webhookTimestamp,
      "webhook-signature": webhookSignature,
    });
  } catch (error) {
    console.error("[webhooks/dodo] verification failed", error);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  const { bookingId, reference, paymentId } = extractIdentifiers(event);
  if (!bookingId && !reference) {
    // Nothing to correlate, so acknowledge to stop Dodo retrying.
    console.warn(`[webhooks/dodo] ${event.type} had no booking metadata`);
    return NextResponse.json({ received: true, handled: false });
  }

  try {
    switch (event.type) {
      case "payment.succeeded": {
        const result = await markOrderPaid({ bookingId, reference, paymentId });
        console.log(
          `[webhooks/dodo] payment.succeeded settled ${result.settled} row(s) for ${result.reference}`,
        );
        return NextResponse.json({ received: true, handled: true });
      }

      case "payment.failed":
      case "payment.cancelled": {
        await markOrderFailed({
          bookingId,
          reference,
          reason: `Payment ${event.type.split(".")[1]} at the payment provider`,
        });
        return NextResponse.json({ received: true, handled: true });
      }

      default:
        // Subscribed-to-but-unhandled events are acknowledged, not retried.
        return NextResponse.json({ received: true, handled: false });
    }
  } catch (error) {
    console.error(`[webhooks/dodo] handler failed for ${event.type}`, error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
