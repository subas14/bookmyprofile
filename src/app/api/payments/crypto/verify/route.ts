import { NextResponse } from "next/server";

import { cryptoVerifySchema, fieldErrors } from "@/lib/validation";
import { amountDueForReference, settleCryptoOrder } from "@/server/bookings";
import { verifyPayment } from "@/server/crypto";
import { enabledChains } from "@/lib/crypto-config";

/**
 * POST /api/payments/crypto/verify
 *
 * Self-custodial crypto settlement. The advertiser has sent USDC / USDT to our
 * published address and submits the transaction hash here. The server:
 *
 *   1. looks up the amount actually due for the reference (never trusts a
 *      client-supplied amount),
 *   2. re-verifies the transfer on-chain (asset, recipient, amount, success),
 *   3. settles the booking idempotently, rejecting a reused transaction hash.
 *
 * Returns 200 with `{ settled: true }` on success; 4xx with a human `error`
 * otherwise so the checkout UI can show it inline.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = cryptoVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the payment details", fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const { reference, chain, asset, txHash } = parsed.data;

  // Guard against a chain that is not switched on for this deployment.
  if (!enabledChains().includes(chain)) {
    return NextResponse.json(
      { error: "That network is not currently accepted." },
      { status: 400 },
    );
  }

  const normalizedReference = reference.toUpperCase();
  const due = await amountDueForReference(normalizedReference);
  if (!due) {
    return NextResponse.json(
      { error: "We could not find that booking reference." },
      { status: 404 },
    );
  }
  if (due.isPaid) {
    return NextResponse.json({ settled: true, alreadyPaid: true });
  }

  const result = await verifyPayment({
    chain,
    asset,
    txHash,
    amountCents: due.amountCents,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 422 });
  }

  const settlement = await settleCryptoOrder({
    reference: normalizedReference,
    chain,
    asset,
    txHash: result.normalizedTxHash,
    amountRaw: result.amountRaw.toString(),
  });

  if (settlement.alreadyUsed) {
    return NextResponse.json(
      {
        error:
          "That transaction has already been used to pay for another booking.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ settled: true, reference: normalizedReference });
}
