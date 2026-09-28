import DodoPayments from "dodopayments";
import { Webhook } from "standardwebhooks";

import { appUrl, isPaymentsConfigured, serverEnv } from "@/lib/env";

/**
 * Dodo Payments integration.
 *
 * Dodo is a merchant-of-record that settles card, wallet and crypto payments,
 * which is why it backs checkout here. Two responsibilities live in this module:
 *
 *  1. Creating a hosted checkout session for a booking.
 *  2. Verifying inbound webhooks (Standard Webhooks spec, HMAC SHA256).
 */

let client: DodoPayments | null = null;

function dodo(): DodoPayments {
  if (client) return client;
  const env = serverEnv();
  if (!env.DODO_PAYMENTS_API_KEY) {
    throw new Error(
      "DODO_PAYMENTS_API_KEY is not set, so it cannot talk to Dodo Payments.",
    );
  }
  client = new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    environment: env.DODO_PAYMENTS_ENVIRONMENT,
  });
  return client;
}

export interface CheckoutSessionInput {
  bookingId: string;
  reference: string;
  /** Total charge in USD cents. */
  amountCents: number;
  advertiserEmail: string;
  advertiserName: string;
  /** Short description shown on the checkout page. */
  description: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string;
}

/**
 * Creates a hosted Dodo checkout session for a booking.
 *
 * The Dodo product referenced by `DODO_PAYMENTS_PRODUCT_ID` must be a one-time
 * "pay what you want" product so the per-booking `amount` can be supplied.
 * `metadata.booking_id` is what the webhook uses to settle the right booking.
 */
export async function createCheckoutSession(
  input: CheckoutSessionInput,
): Promise<CheckoutSessionResult> {
  const env = serverEnv();
  if (!env.DODO_PAYMENTS_PRODUCT_ID) {
    throw new Error(
      "DODO_PAYMENTS_PRODUCT_ID is not set, so a session cannot be created a checkout session.",
    );
  }

  const session = await dodo().checkoutSessions.create({
    product_cart: [
      {
        product_id: env.DODO_PAYMENTS_PRODUCT_ID,
        quantity: 1,
        amount: input.amountCents,
      },
    ],
    customer: {
      email: input.advertiserEmail,
      name: input.advertiserName,
    },
    metadata: {
      booking_id: input.bookingId,
      booking_reference: input.reference,
    },
    return_url: `${appUrl()}/checkout/return?reference=${encodeURIComponent(
      input.reference,
    )}`,
  });

  if (!session.checkout_url) {
    throw new Error("Dodo Payments did not return a checkout URL.");
  }

  return { sessionId: session.session_id, checkoutUrl: session.checkout_url };
}

/** Minimal shape of the Dodo webhook envelope that this app relies on. */
export interface DodoWebhookEvent {
  type: string;
  data?: {
    payment_id?: string;
    status?: string;
    metadata?: Record<string, string> | null;
    [key: string]: unknown;
  };
}

/**
 * Verifies a webhook signature and returns the parsed event.
 *
 * Throws when the signature, timestamp or secret is invalid, and the caller must
 * translate that into a 400 so Dodo retries rather than silently dropping it.
 */
export function verifyWebhook(
  rawBody: string,
  headers: {
    "webhook-id": string;
    "webhook-timestamp": string;
    "webhook-signature": string;
  },
): DodoWebhookEvent {
  const env = serverEnv();
  if (!env.DODO_PAYMENTS_WEBHOOK_SECRET) {
    throw new Error("DODO_PAYMENTS_WEBHOOK_SECRET is not set.");
  }

  const webhook = new Webhook(env.DODO_PAYMENTS_WEBHOOK_SECRET);
  // Throws WebhookVerificationError on tampering or stale timestamps.
  webhook.verify(rawBody, headers);

  return JSON.parse(rawBody) as DodoWebhookEvent;
}

export { isPaymentsConfigured };
