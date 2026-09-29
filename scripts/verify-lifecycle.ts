/**
 * End-to-end booking lifecycle check against the real database.
 *
 * Verifies the rules that protect revenue and inventory:
 *  - a PENDING_PAYMENT booking does not consume inventory
 *  - settling payment moves it into the review queue and blocks the slot
 *  - replayed webhooks are idempotent
 *  - a conflicting booking for the same slot/term is rejected
 *  - two unpaid orders for the same single-tenant slot cannot BOTH settle
 *    (the later settlement is cancelled for refund, not double-booked)
 *  - back-to-back terms are allowed
 *  - illegal status transitions are refused
 *
 * Run with: npm run test:lifecycle
 */
import { prisma } from "../src/lib/prisma.ts";
import {
  BookingError,
  createBooking,
  markOrderPaid,
  transitionBooking,
} from "../src/server/bookings.ts";
import { availabilityForTerm } from "../src/server/availability.ts";
import { addMonthsUtc, todayUtc, toDateInputValue } from "../src/lib/dates.ts";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = String(actual) === String(expected);
  if (!ok) failures += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label}\n      expected ${expected}, got ${actual}`,
  );
}

const ADVERTISER = {
  advertiserName: "Lifecycle Test",
  advertiserEmail: "lifecycle@test.local",
  brandName: "Test Brand",
  targetUrl: "https://example.com",
};

/** Removes only the rows this script creates, leaving seed data intact. */
async function cleanup() {
  const rows = await prisma.booking.findMany({
    where: { advertiserEmail: ADVERTISER.advertiserEmail },
    select: { id: true },
  });
  const ids = rows.map((row) => row.id);
  if (ids.length > 0) {
    await prisma.bookingEvent.deleteMany({ where: { bookingId: { in: ids } } });
    await prisma.campaignMetric.deleteMany({
      where: { bookingId: { in: ids } },
    });
    await prisma.booking.deleteMany({ where: { id: { in: ids } } });
  }
}

async function main() {
  await cleanup();

  const creator = await prisma.creator.findFirstOrThrow({
    where: { slug: "shub0414" },
    select: { id: true, slug: true },
  });

  const start = todayUtc();
  const startStr = toDateInputValue(start);
  // A single-tenant cover half (maxConcurrent = 1) so the conflict checks below
  // are deterministic.
  const slot = "cover-left";

  // --- 1. Create an unpaid booking ----------------------------------------
  const booking = await createBooking({
    creatorSlug: creator.slug,
    slotKeys: [slot],
    months: 2,
    startDate: startStr,
    includePromoPost: false,
    ...ADVERTISER,
  });
  check("booking created with one row", booking.ids.length, 1);
  // Cover half is $99/mo; 2 months is below the 3-month discount tier and a
  // single slot earns no bundle discount, so the total is a flat 2 x $99.
  check("2 months of a $99 slot = $198", booking.totalAmountCents, 19_800);

  const created = await prisma.booking.findUniqueOrThrow({
    where: { id: booking.ids[0] },
    select: { status: true, endDate: true },
  });
  check("initial status", created.status, "PENDING_PAYMENT");
  check(
    "end date is start + 2 months",
    toDateInputValue(created.endDate),
    toDateInputValue(addMonthsUtc(start, 2)),
  );

  // Unpaid bookings must not reserve inventory.
  let availability = await availabilityForTerm(creator.id, start, 2);
  check(
    "unpaid booking does not block the slot",
    availability[slot].available,
    true,
  );

  // --- 2. Settle payment ---------------------------------------------------
  const settled = await markOrderPaid({
    reference: booking.reference,
    paymentId: "pay_test_123",
  });
  check("rows settled on first webhook", settled.settled, 1);

  const paid = await prisma.booking.findUniqueOrThrow({
    where: { id: booking.ids[0] },
    select: { status: true, paymentId: true },
  });
  check("status after payment", paid.status, "AWAITING_REVIEW");
  check("payment id recorded", paid.paymentId, "pay_test_123");

  availability = await availabilityForTerm(creator.id, start, 2);
  check("paid booking blocks the slot", availability[slot].available, false);

  // --- 3. Webhook replay must be a no-op ----------------------------------
  const replay = await markOrderPaid({
    reference: booking.reference,
    paymentId: "pay_test_123",
  });
  check("replayed webhook settles nothing", replay.settled, 0);

  // --- 4. Conflicting booking is rejected ---------------------------------
  let conflictCode = "none";
  try {
    await createBooking({
      creatorSlug: creator.slug,
      slotKeys: [slot],
      months: 1,
      startDate: startStr,
      includePromoPost: false,
      ...ADVERTISER,
    });
  } catch (error) {
    if (error instanceof BookingError) conflictCode = error.code;
  }
  check("overlapping booking rejected", conflictCode, "UNAVAILABLE");

  // --- 5. Back-to-back term is allowed -----------------------------------
  const nextStart = toDateInputValue(addMonthsUtc(start, 2));
  const backToBack = await createBooking({
    creatorSlug: creator.slug,
    slotKeys: [slot],
    months: 1,
    startDate: nextStart,
    includePromoPost: false,
    ...ADVERTISER,
  });
  check("back-to-back term accepted", backToBack.ids.length, 1);

  // --- 6. Status transition rules ----------------------------------------
  // AWAITING_REVIEW -> COMPLETED is not a legal jump.
  const illegal = await transitionBooking({
    bookingId: booking.ids[0],
    action: "complete",
  });
  check("illegal transition refused", illegal.ok, false);

  const approved = await transitionBooking({
    bookingId: booking.ids[0],
    action: "approve",
  });
  check("approve accepted", approved.ok, true);

  const activated = await transitionBooking({
    bookingId: booking.ids[0],
    action: "activate",
  });
  check("activate accepted", activated.ok, true);

  const final = await prisma.booking.findUniqueOrThrow({
    where: { id: booking.ids[0] },
    select: { status: true, events: { select: { type: true } } },
  });
  check("final status", final.status, "LIVE");
  check("audit trail recorded", final.events.length >= 4, true);

  // --- 7. Multi-placement order shares one reference and sums correctly ---
  const bundle = await createBooking({
    creatorSlug: creator.slug,
    slotKeys: ["cover-right", "bio-link"],
    months: 1,
    startDate: startStr,
    includePromoPost: false,
    ...ADVERTISER,
  });
  check("bundle creates a row per placement", bundle.ids.length, 2);
  // $99 cover half + $89 bio link = $188 subtotal, less a 5% two-slot bundle
  // discount ($9.40) = $178.60.
  check("bundle total", bundle.totalAmountCents, 17_860);

  const bundleRows = await prisma.booking.findMany({
    where: { reference: bundle.reference },
    select: { totalAmountCents: true },
  });
  const summed = bundleRows.reduce((sum, row) => sum + row.totalAmountCents, 0);
  check("row totals sum to the charged amount", summed, bundle.totalAmountCents);

  // --- 8. Oversell guard: two unpaid orders, same single-tenant slot -------
  // Pending bookings do not reserve inventory, so both are allowed to reach
  // checkout. Whoever settles first wins the slot; the later settlement must
  // be cancelled (for refund), never admitted to the review queue.
  const farStart = toDateInputValue(addMonthsUtc(start, 24));
  const first = await createBooking({
    creatorSlug: creator.slug,
    slotKeys: [slot],
    months: 1,
    startDate: farStart,
    includePromoPost: false,
    ...ADVERTISER,
  });
  const second = await createBooking({
    creatorSlug: creator.slug,
    slotKeys: [slot],
    months: 1,
    startDate: farStart,
    includePromoPost: false,
    ...ADVERTISER,
  });
  check(
    "two pending orders exist for the same single-tenant slot",
    first.reference !== second.reference,
    true,
  );

  const firstPaid = await markOrderPaid({
    reference: first.reference,
    paymentId: "pay_first",
  });
  check("first settlement admits the slot", firstPaid.settled, 1);
  check("first settlement not oversold", firstPaid.oversold ?? 0, 0);

  const secondPaid = await markOrderPaid({
    reference: second.reference,
    paymentId: "pay_second",
  });
  check("second settlement admits nothing", secondPaid.settled, 0);
  check("second settlement flagged oversold", secondPaid.oversold ?? 0, 1);

  const firstRow = await prisma.booking.findFirstOrThrow({
    where: { reference: first.reference },
    select: { status: true },
  });
  const secondRow = await prisma.booking.findFirstOrThrow({
    where: { reference: second.reference },
    select: { status: true, paymentSettledAt: true },
  });
  check("winner is in review", firstRow.status, "AWAITING_REVIEW");
  check("loser is cancelled", secondRow.status, "CANCELLED");
  check(
    "loser payment still recorded for refund",
    secondRow.paymentSettledAt !== null,
    true,
  );

  const farAvail = await availabilityForTerm(
    creator.id,
    addMonthsUtc(start, 24),
    1,
  );
  check(
    "slot held by exactly one paid order",
    farAvail[slot].overlapping,
    1,
  );

  await cleanup();

  console.log(
    failures === 0
      ? "\nAll lifecycle checks passed."
      : `\n${failures} lifecycle check(s) failed.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(failures === 0 ? 0 : 1);
  })
  .catch(async (error) => {
    console.error(error);
    await cleanup().catch(() => {});
    await prisma.$disconnect();
    process.exit(1);
  });
