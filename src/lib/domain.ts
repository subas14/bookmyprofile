/**
 * Shared domain vocabulary.
 *
 * Status and kind fields are persisted as strings (so the same Prisma schema
 * targets both SQLite and Postgres) but are constrained here so the rest of the
 * codebase is fully type-safe.
 */

export const PLACEMENT_KINDS = ["COVER_SLOT", "BIO_LINK", "PROMO_POST"] as const;
export type PlacementKind = (typeof PLACEMENT_KINDS)[number];

export const BOOKING_STATUSES = [
  "PENDING_PAYMENT",
  "AWAITING_REVIEW",
  "SCHEDULED",
  "LIVE",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "REFUNDED",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/**
 * Statuses that consume inventory. A placement is unavailable for a date range
 * when a booking in one of these states already overlaps it.
 */
export const INVENTORY_BLOCKING_STATUSES: readonly BookingStatus[] = [
  "AWAITING_REVIEW",
  "SCHEDULED",
  "LIVE",
];

/** Statuses an advertiser considers "in flight" (paid, not yet finished). */
export const ACTIVE_STATUSES: readonly BookingStatus[] = [
  "AWAITING_REVIEW",
  "SCHEDULED",
  "LIVE",
];

export function isBookingStatus(value: string): value is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(value);
}

export function isPlacementKind(value: string): value is PlacementKind {
  return (PLACEMENT_KINDS as readonly string[]).includes(value);
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "Pending payment",
  AWAITING_REVIEW: "Awaiting creator review",
  SCHEDULED: "Scheduled",
  LIVE: "Live",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
  REFUNDED: "Refunded",
};

/**
 * Tailwind classes for rendering a status pill. Each entry is a tinted wash
 * plus a matching border, so pills stay legible in both light and dark themes.
 */
export const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "border-warning/30 bg-warning-wash text-warning",
  AWAITING_REVIEW: "border-accent/30 bg-accent-wash text-accent",
  SCHEDULED: "border-accent/30 bg-accent-wash text-accent",
  LIVE: "border-success/30 bg-success-wash text-success",
  COMPLETED: "border-line bg-subtle text-muted",
  CANCELLED: "border-line bg-subtle text-faint",
  REJECTED: "border-danger/30 bg-danger-wash text-danger",
  REFUNDED: "border-line-strong bg-subtle-strong text-muted",
};

export const PLACEMENT_KIND_LABELS: Record<PlacementKind, string> = {
  COVER_SLOT: "Cover photo slot",
  BIO_LINK: "Bio link",
  PROMO_POST: "Promotional post",
};

/**
 * The two purchasable regions of the cover image. The cover is split down the
 * middle, so each slot is a full half of the image, not a small corner badge.
 */
export const COVER_SLOT_KEYS = ["cover-left", "cover-right"] as const;
export type CoverSlotKey = (typeof COVER_SLOT_KEYS)[number];

export const BIO_LINK_SLOT_KEY = "bio-link";
export const PROMO_POST_SLOT_KEY = "promo-post";

/**
 * How many brands can hold the bio-link placement at the same time. The bio
 * carries up to three product URLs, one line each, so three advertisers can
 * run concurrently. Mirrored in `Placement.maxConcurrent` by the seed.
 */
export const BIO_LINK_MAX_CONCURRENT = 3;

/**
 * Launch special: a short, cheap trial of the product link in bio.
 *
 * Every other term is a whole number of months, so the launch special travels
 * through the API and is stored on `Booking.months` as the sentinel value `0`.
 * `termEndDate()` turns that into a fixed 14-day window. Always test for it via
 * `isLaunchTerm()` rather than comparing against 0 directly.
 */
export const LAUNCH_TERM_MONTHS = 0;
export const LAUNCH_TERM_DAYS = 14;

export function isLaunchTerm(months: number): boolean {
  return months === LAUNCH_TERM_MONTHS;
}

/** Short human label for each cover half. */
export const COVER_SLOT_LABELS: Record<CoverSlotKey, string> = {
  "cover-left": "Left half",
  "cover-right": "Right half",
};

/**
 * CSS positioning for each cover half inside the preview mock. Every slot is
 * exactly half the width and the full height of the cover.
 */
export const COVER_SLOT_POSITIONS: Record<CoverSlotKey, string> = {
  "cover-left": "left-0 top-0 h-full w-1/2",
  "cover-right": "right-0 top-0 h-full w-1/2",
};
