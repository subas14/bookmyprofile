import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { BookingRequest } from "@/lib/validation";
import { LAUNCH_SPECIAL, quote, type PricingQuote } from "@/lib/pricing";
import { startOfUtcDay, termEndDate, todayUtc } from "@/lib/dates";
import {
  INVENTORY_BLOCKING_STATUSES,
  PROMO_POST_SLOT_KEY,
  isLaunchTerm,
  type BookingStatus,
} from "@/lib/domain";
import { findUnavailableSlots } from "@/server/availability";
import { generateReference } from "@/server/reference";

/**
 * Booking service: quoting, creation, payment settlement and moderation.
 *
 * Bookings are created in `PENDING_PAYMENT` and only consume inventory once the
 * Dodo webhook confirms payment, at which point they move to `AWAITING_REVIEW`.
 */

export type BookingErrorCode =
  | "CREATOR_NOT_FOUND"
  | "PLACEMENT_NOT_FOUND"
  | "UNAVAILABLE"
  | "INVALID_TERM"
  | "INVALID_START_DATE";

export class BookingError extends Error {
  code: BookingErrorCode;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    code: BookingErrorCode,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "BookingError";
    this.code = code;
    this.details = details;
  }
}

/** Builds a quote from persisted prices, never from client-supplied amounts. */
export async function quoteForRequest(params: {
  creatorSlug: string;
  slotKeys: string[];
  months: number;
  includePromoPost: boolean;
}): Promise<{ pricing: PricingQuote; creatorId: string }> {
  const creator = await prisma.creator.findFirst({
    where: { slug: params.creatorSlug, isActive: true },
    select: { id: true, promoPostPriceCents: true },
  });
  if (!creator) {
    throw new BookingError("Creator not found", "CREATOR_NOT_FOUND");
  }

  const selected = params.slotKeys.filter((key) => key !== PROMO_POST_SLOT_KEY);

  const placements = await prisma.placement.findMany({
    where: { creatorId: creator.id, isActive: true, slotKey: { in: selected } },
    select: {
      slotKey: true,
      label: true,
      priceMonthlyCents: true,
      minMonths: true,
      maxMonths: true,
    },
  });

  if (placements.length !== selected.length) {
    const found = new Set(placements.map((p) => p.slotKey));
    throw new BookingError(
      "One or more placements could not be found",
      "PLACEMENT_NOT_FOUND",
      { missing: selected.filter((key) => !found.has(key)) },
    );
  }

  const launch = isLaunchTerm(params.months);
  if (launch) {
    // The launch special is a bio-link-only offer. Enforced here, not just in
    // the UI, so it cannot be applied to a cover half via the API.
    if (!LAUNCH_SPECIAL.active) {
      throw new BookingError(
        "The launch special is no longer available",
        "INVALID_TERM",
      );
    }
    const invalid = placements.filter(
      (p) => p.slotKey !== LAUNCH_SPECIAL.slotKey,
    );
    if (invalid.length > 0) {
      throw new BookingError(
        "The launch special only applies to the product link in bio",
        "INVALID_TERM",
        { slotKeys: invalid.map((p) => p.slotKey) },
      );
    }
    if (params.includePromoPost) {
      throw new BookingError(
        "The promo post add-on is not available with the launch special",
        "INVALID_TERM",
      );
    }
  }

  for (const placement of launch ? [] : placements) {
    if (
      params.months < placement.minMonths ||
      params.months > placement.maxMonths
    ) {
      throw new BookingError(
        `${placement.label} can be booked for ${placement.minMonths}–${placement.maxMonths} months`,
        "INVALID_TERM",
        { slotKey: placement.slotKey },
      );
    }
  }

  const pricing = quote({
    items: placements.map((p) => ({
      slotKey: p.slotKey,
      label: p.label,
      priceMonthlyCents: p.priceMonthlyCents,
    })),
    months: params.months,
    includePromoPost: params.includePromoPost,
    promoPostPriceCents: creator.promoPostPriceCents,
  });

  return { pricing, creatorId: creator.id };
}

export interface CreatedBooking {
  ids: string[];
  reference: string;
  totalAmountCents: number;
  pricing: PricingQuote;
  startDate: Date;
  endDate: Date;
}

/**
 * Creates the booking rows for a request.
 *
 * A multi-placement order becomes one `Booking` row per placement sharing a
 * single `reference`, so inventory stays modelled per placement while the
 * advertiser sees (and pays for) one campaign. Discounts and the promo add-on
 * are attributed to the first row so the sum of `totalAmountCents` across the
 * order equals the amount actually charged.
 *
 * Availability is re-validated inside the transaction to close the window
 * between quoting and writing.
 */
export async function createBooking(
  input: BookingRequest,
): Promise<CreatedBooking> {
  const { pricing, creatorId } = await quoteForRequest({
    creatorSlug: input.creatorSlug,
    slotKeys: input.slotKeys,
    months: input.months,
    includePromoPost: input.includePromoPost,
  });

  const start = input.startDate ? startOfUtcDay(input.startDate) : todayUtc();
  if (start < todayUtc()) {
    throw new BookingError(
      "Start date cannot be in the past",
      "INVALID_START_DATE",
    );
  }
  const end = termEndDate(start, pricing.months);

  const slotKeys = pricing.lineItems.map((item) => item.slotKey);
  if (slotKeys.length === 0) {
    throw new BookingError(
      "Select at least one placement",
      "PLACEMENT_NOT_FOUND",
    );
  }

  const unavailable = await findUnavailableSlots(
    creatorId,
    slotKeys,
    start,
    pricing.months,
  );
  if (unavailable.length > 0) {
    throw new BookingError(
      "Some placements are already booked for that period",
      "UNAVAILABLE",
      { slotKeys: unavailable },
    );
  }

  const reference = generateReference();

  return prisma.$transaction(async (tx) => {
    // Re-check inside the transaction to guard against a concurrent booking
    // that was committed between the check above and this write.
    const conflicts = await tx.booking.findMany({
      where: {
        creatorId,
        status: { in: ["AWAITING_REVIEW", "SCHEDULED", "LIVE"] },
        startDate: { lt: end },
        endDate: { gt: start },
        placement: { slotKey: { in: slotKeys } },
      },
      select: { placement: { select: { slotKey: true, maxConcurrent: true } } },
    });

    const counts = new Map<string, { count: number; max: number }>();
    for (const conflict of conflicts) {
      const key = conflict.placement.slotKey;
      const entry = counts.get(key) ?? {
        count: 0,
        max: conflict.placement.maxConcurrent,
      };
      entry.count += 1;
      counts.set(key, entry);
    }
    const blocked = [...counts.entries()]
      .filter(([, entry]) => entry.count >= entry.max)
      .map(([key]) => key);

    if (blocked.length > 0) {
      throw new BookingError(
        "Some placements were just booked by someone else",
        "UNAVAILABLE",
        { slotKeys: blocked },
      );
    }

    const placements = await tx.placement.findMany({
      where: { creatorId, slotKey: { in: slotKeys } },
      select: { id: true, slotKey: true },
    });
    const placementIdBySlot = new Map(
      placements.map((p) => [p.slotKey, p.id] as const),
    );

    const ids: string[] = [];
    for (const [index, item] of pricing.lineItems.entries()) {
      const placementId = placementIdBySlot.get(item.slotKey);
      if (!placementId) {
        throw new BookingError(
          `Placement ${item.slotKey} not found`,
          "PLACEMENT_NOT_FOUND",
        );
      }

      const isPrimary = index === 0;
      const share = isPrimary
        ? pricing.totalCents -
          (pricing.placementSubtotalCents - item.subtotalCents)
        : item.subtotalCents;

      const booking = await tx.booking.create({
        data: {
          reference,
          creatorId,
          placementId,
          advertiserName: input.advertiserName,
          advertiserEmail: input.advertiserEmail,
          brandName: input.brandName,
          targetUrl: input.targetUrl,
          assetUrl: input.assetUrl,
          notes: input.notes,
          months: pricing.months,
          startDate: start,
          endDate: end,
          listAmountCents: item.subtotalCents,
          discountCents: isPrimary ? pricing.discountCents : 0,
          promoAddonCents: isPrimary ? pricing.promoAddonCents : 0,
          totalAmountCents: share,
          pricingBreakdown: JSON.stringify({
            ...pricing,
            role: isPrimary ? "primary" : "secondary",
            slotKey: item.slotKey,
          }),
          includesPromoPost: isPrimary ? pricing.includesPromoPost : false,
          status: "PENDING_PAYMENT",
        },
        select: { id: true },
      });

      ids.push(booking.id);

      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          type: "created",
          message: `Booking created for ${item.label}`,
          metadata: JSON.stringify({
            slotKey: item.slotKey,
            months: pricing.months,
            reference,
          }),
        },
      });
    }

    return {
      ids,
      reference,
      totalAmountCents: pricing.totalCents,
      pricing,
      startDate: start,
      endDate: end,
    };
  });
}

/** Records the checkout session id against every row of an order. */
export async function attachCheckoutSession(
  reference: string,
  sessionId: string,
): Promise<void> {
  await prisma.booking.updateMany({
    where: { reference },
    data: { checkoutSessionId: sessionId },
  });
}

/**
 * Rows of an order that CANNOT be admitted to the review queue on settlement
 * because their placement is already at `maxConcurrent` for the term, held by
 * *other* orders whose payment settled first.
 *
 * Pending bookings intentionally do not reserve inventory, so two advertisers
 * can both reach checkout for the same single-tenant slot. Whoever settles
 * first wins the slot; a later settlement for the same slot/term is oversold
 * and must be routed to CANCELLED (with a refund trail) rather than blindly
 * entering AWAITING_REVIEW. Run inside the settlement transaction so the
 * capacity read and the status write are atomic.
 */
async function oversoldRowIds(
  tx: Prisma.TransactionClient,
  reference: string,
  rows: { id: string; placementId: string; startDate: Date; endDate: Date }[],
): Promise<Set<string>> {
  const oversold = new Set<string>();
  // Per placement, how many concurrent slots exist and how many are already
  // consumed by other (already-settled) orders overlapping this term.
  const seenThisOrder = new Map<string, number>();

  for (const row of rows) {
    const placement = await tx.placement.findUnique({
      where: { id: row.placementId },
      select: { maxConcurrent: true },
    });
    const max = placement?.maxConcurrent ?? 1;

    const heldByOthers = await tx.booking.count({
      where: {
        reference: { not: reference },
        placementId: row.placementId,
        status: { in: [...INVENTORY_BLOCKING_STATUSES] },
        startDate: { lt: row.endDate },
        endDate: { gt: row.startDate },
      },
    });

    // Rows within this same order also consume capacity as we admit them.
    const alreadyAdmitted = seenThisOrder.get(row.placementId) ?? 0;
    if (heldByOthers + alreadyAdmitted >= max) {
      oversold.add(row.id);
    } else {
      seenThisOrder.set(row.placementId, alreadyAdmitted + 1);
    }
  }

  return oversold;
}

/**
 * Settles payment for an order and moves it into the creator's review queue.
 *
 * Idempotent: Dodo retries webhooks, so rows already carrying
 * `paymentSettledAt` are skipped.
 *
 * Oversold protection: a row whose placement is already full for the term
 * (another order settled first) is still marked paid — so the payment is on
 * record and refundable — but routed to CANCELLED with a `payment_oversold`
 * event instead of AWAITING_REVIEW, so a single-tenant slot is never held by
 * two paid orders at once.
 */
export async function markOrderPaid(params: {
  bookingId?: string;
  reference?: string;
  paymentId?: string;
}): Promise<{ settled: number; reference: string | null; oversold?: number }> {
  const where = params.reference
    ? { reference: params.reference }
    : params.bookingId
      ? { id: params.bookingId }
      : null;
  if (!where) return { settled: 0, reference: null };

  const anchor = await prisma.booking.findFirst({
    where,
    select: { reference: true },
  });
  if (!anchor) return { settled: 0, reference: null };

  const rows = await prisma.booking.findMany({
    where: { reference: anchor.reference, paymentSettledAt: null },
    select: { id: true, placementId: true, startDate: true, endDate: true },
  });
  if (rows.length === 0) {
    return { settled: 0, reference: anchor.reference };
  }

  const now = new Date();
  let oversoldCount = 0;
  await prisma.$transaction(
    async (tx) => {
      const oversold = await oversoldRowIds(tx, anchor.reference, rows);
      oversoldCount = oversold.size;

      for (const row of rows) {
        const isOversold = oversold.has(row.id);
        await tx.booking.update({
          where: { id: row.id },
          data: {
            // Always record the payment so it is auditable and refundable.
            status: isOversold ? "CANCELLED" : "AWAITING_REVIEW",
            paidAt: now,
            paymentSettledAt: now,
            paymentId: params.paymentId,
          },
        });
        await tx.bookingEvent.create({
          data: {
            bookingId: row.id,
            type: isOversold ? "payment_oversold" : "payment_succeeded",
            message: isOversold
              ? "Payment confirmed but the placement was already taken for this term; order cancelled for refund."
              : "Payment confirmed, awaiting creator review",
            metadata: params.paymentId
              ? JSON.stringify({ paymentId: params.paymentId })
              : null,
          },
        });
      }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  return {
    settled: rows.length - oversoldCount,
    reference: anchor.reference,
    oversold: oversoldCount,
  };
}

/** Cancels the pending rows of an order after an unsuccessful payment. */
export async function markOrderFailed(params: {
  bookingId?: string;
  reference?: string;
  reason: string;
}): Promise<void> {
  const where = params.reference
    ? { reference: params.reference }
    : params.bookingId
      ? { id: params.bookingId }
      : null;
  if (!where) return;

  const rows = await prisma.booking.findMany({
    where: { ...where, status: "PENDING_PAYMENT" },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      await tx.booking.update({
        where: { id: row.id },
        data: { status: "CANCELLED" },
      });
      await tx.bookingEvent.create({
        data: {
          bookingId: row.id,
          type: "payment_failed",
          message: params.reason,
        },
      });
    }
  });
}

/**
 * Settles an order paid with self-custodial crypto (USDC / USDT).
 *
 * Called after `verifyPayment` has confirmed the on-chain transfer. Records the
 * chain/asset/tx-hash/amount and moves the order into review. Idempotent on two
 * levels: the unique `cryptoTxHash` column rejects a replayed transfer at the
 * database, and rows already carrying `paymentSettledAt` are skipped here.
 *
 * Returns `alreadyUsed` when the transaction hash has already settled a
 * (different) booking, so the caller can refuse to credit it twice.
 */
export async function settleCryptoOrder(params: {
  reference: string;
  chain: string;
  asset: string;
  txHash: string;
  amountRaw: string;
}): Promise<{
  settled: number;
  reference: string | null;
  alreadyUsed: boolean;
  oversold?: number;
}> {
  const anchor = await prisma.booking.findFirst({
    where: { reference: params.reference },
    select: { reference: true },
  });
  if (!anchor) return { settled: 0, reference: null, alreadyUsed: false };

  // Reject a transaction hash that has already been recorded against any other
  // reference — a transfer settles exactly one order.
  const priorUse = await prisma.booking.findFirst({
    where: { cryptoTxHash: params.txHash, reference: { not: anchor.reference } },
    select: { id: true },
  });
  if (priorUse) {
    return { settled: 0, reference: anchor.reference, alreadyUsed: true };
  }

  const rows = await prisma.booking.findMany({
    where: { reference: anchor.reference, paymentSettledAt: null },
    select: { id: true, placementId: true, startDate: true, endDate: true },
  });
  if (rows.length === 0) {
    // Already settled (e.g. a double submit): treat as success, not a replay.
    return { settled: 0, reference: anchor.reference, alreadyUsed: false };
  }

  const now = new Date();
  let oversoldCount = 0;
  try {
    await prisma.$transaction(
      async (tx) => {
        const oversold = await oversoldRowIds(tx, anchor.reference, rows);
        oversoldCount = oversold.size;

        for (const [index, row] of rows.entries()) {
          const isOversold = oversold.has(row.id);
          await tx.booking.update({
            where: { id: row.id },
            data: {
              // Record the payment regardless so it is auditable/refundable;
              // an oversold slot is cancelled rather than admitted to review.
              status: isOversold ? "CANCELLED" : "AWAITING_REVIEW",
              paidAt: now,
              paymentSettledAt: now,
              paymentProvider: "crypto",
              paymentId: params.txHash,
              cryptoChain: params.chain,
              cryptoAsset: params.asset,
              // The unique tx hash can only sit on one row; anchor it to the
              // first and leave the rest correlated by reference.
              cryptoTxHash: index === 0 ? params.txHash : null,
              cryptoAmountRaw: index === 0 ? params.amountRaw : null,
            },
          });
          await tx.bookingEvent.create({
            data: {
              bookingId: row.id,
              type: isOversold ? "payment_oversold" : "payment_succeeded",
              message: isOversold
                ? `Crypto payment confirmed on ${params.chain} (${params.asset}) but the placement was already taken for this term; order cancelled for refund.`
                : `Crypto payment confirmed on ${params.chain} (${params.asset})`,
              metadata: JSON.stringify({
                chain: params.chain,
                asset: params.asset,
                txHash: params.txHash,
                amountRaw: params.amountRaw,
              }),
            },
          });
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    // A unique-constraint race on cryptoTxHash means a concurrent request beat
    // us to it; surface as already-used rather than a 500.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return { settled: 0, reference: anchor.reference, alreadyUsed: true };
    }
    throw error;
  }

  return {
    settled: rows.length - oversoldCount,
    reference: anchor.reference,
    alreadyUsed: false,
    oversold: oversoldCount,
  };
}

/**
 * Amount still owed on an order, in USD cents, or null if the reference is
 * unknown. Sums the order's rows so multi-placement bundles resolve correctly.
 */
export async function amountDueForReference(
  reference: string,
): Promise<{ amountCents: number; isPaid: boolean } | null> {
  const rows = await prisma.booking.findMany({
    where: { reference },
    select: { totalAmountCents: true, paymentSettledAt: true },
  });
  if (rows.length === 0) return null;
  return {
    amountCents: rows.reduce((sum, r) => sum + r.totalAmountCents, 0),
    isPaid: rows.every((r) => r.paymentSettledAt !== null),
  };
}

/** Advertiser-facing campaign lookup. Email is required for non-admin access. */
export async function findOrderByReference(reference: string, email?: string) {
  return prisma.booking.findMany({
    where: {
      reference,
      ...(email ? { advertiserEmail: email } : {}),
    },
    include: {
      placement: true,
      creator: {
        select: {
          displayName: true,
          handle: true,
          slug: true,
          profileUrl: true,
        },
      },
      events: { orderBy: { createdAt: "desc" } },
      metrics: { orderBy: { date: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });
}

/** Legal state transitions, enforced server-side by the creator console. */
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  AWAITING_REVIEW: ["SCHEDULED", "REJECTED"],
  SCHEDULED: ["LIVE", "CANCELLED"],
  LIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
  REFUNDED: [],
};

const ACTION_TARGET = {
  approve: "SCHEDULED",
  reject: "REJECTED",
  activate: "LIVE",
  complete: "COMPLETED",
  cancel: "CANCELLED",
} as const satisfies Record<string, BookingStatus>;

export type BookingAction = keyof typeof ACTION_TARGET;

export async function transitionBooking(params: {
  bookingId: string;
  action: BookingAction;
  reason?: string;
}): Promise<{ ok: boolean; message: string }> {
  const target = ACTION_TARGET[params.action];
  if (!target) return { ok: false, message: "Unknown action" };

  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    select: { id: true, status: true },
  });
  if (!booking) return { ok: false, message: "Booking not found" };

  const current = booking.status as BookingStatus;
  if (!ALLOWED_TRANSITIONS[current]?.includes(target)) {
    return {
      ok: false,
      message: `Cannot move a booking from ${current} to ${target}`,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: target },
    });
    await tx.bookingEvent.create({
      data: {
        bookingId: booking.id,
        type: params.action,
        message:
          params.reason?.trim() ||
          `Status changed from ${current} to ${target}`,
      },
    });
  });

  return { ok: true, message: `Booking moved to ${target}` };
}
