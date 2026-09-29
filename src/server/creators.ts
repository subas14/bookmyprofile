import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import { PRIMARY_CREATOR_SLUG } from "@/lib/env";
import type { PlacementKind } from "@/lib/domain";

/**
 * Creator read model.
 *
 * These queries power the public marketing, analytics and booking pages. They
 * are always creator-scoped so adding more creators needs no query changes.
 */

export type CreatorProfile = NonNullable<
  Awaited<ReturnType<typeof getCreatorBySlug>>
>;

/**
 * Cache lifetime for the creator profile, in seconds.
 *
 * The profile (bio, placements, published analytics snapshots, testimonials)
 * changes rarely, but the query joins five relations and — against a remote
 * Neon database — costs several seconds cold. Serving it from the data cache
 * takes the public pages from multi-second waits to a local network round-trip.
 * Bust it early with `revalidateTag("creator")` after an admin edit or seed.
 */
export const CREATOR_CACHE_SECONDS = 300;
export const CREATOR_CACHE_TAG = "creator";

/**
 * Date fields carried by the creator profile and its relations.
 *
 * `unstable_cache` persists results as JSON, so `Date` values return as ISO
 * strings on a cache hit. Rendering code relies on real `Date`s (e.g.
 * `snapshotFor` calls `.getTime()`, and `formatDate` expects a `Date`), so the
 * cached payload is walked and these keys revived. Keyed by field name rather
 * than by sniffing string shapes, so genuine text fields are never touched.
 */
const CREATOR_DATE_KEYS = new Set([
  "joinedAt",
  "createdAt",
  "updatedAt",
  "periodStart",
  "periodEnd",
  "capturedAt",
  "date",
]);

/** Recursively restores `Date` objects on a cached (JSON-deserialised) value. */
function reviveCreatorDates<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      value[i] = reviveCreatorDates(value[i]);
    }
    return value;
  }

  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const child = record[key];
    if (typeof child === "string" && CREATOR_DATE_KEYS.has(key)) {
      record[key] = new Date(child);
    } else if (child !== null && typeof child === "object") {
      record[key] = reviveCreatorDates(child);
    }
  }
  return value;
}

/** The uncached, expensive five-relation profile query. */
function fetchCreatorBySlug(slug: string) {
  return prisma.creator.findFirst({
    where: { slug, isActive: true },
    include: {
      placements: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      analyticsSnapshots: {
        orderBy: [{ periodDays: "asc" }, { periodEnd: "desc" }],
      },
      audienceSegments: {
        orderBy: { sortOrder: "asc" },
      },
      testimonials: {
        where: { isPublished: true },
        orderBy: { sortOrder: "asc" },
      },
      dailyMetrics: {
        orderBy: { date: "asc" },
      },
    },
  });
}

const getCreatorBySlugCached = unstable_cache(
  (slug: string) => fetchCreatorBySlug(slug),
  ["creator-by-slug"],
  { revalidate: CREATOR_CACHE_SECONDS, tags: [CREATOR_CACHE_TAG] },
);

export async function getCreatorBySlug(slug: string) {
  const creator = await getCreatorBySlugCached(slug);
  // Revive on every read: a no-op on a fresh miss (values are real `Date`s),
  // and the string→`Date` restoration on a hit.
  return reviveCreatorDates(creator);
}

/**
 * The rolling windows published on the analytics page, in display order.
 *
 * These mirror the range selector in X Analytics so an advertiser can compare
 * the figures here against the source dashboard tab for tab.
 */
export const ANALYTICS_WINDOWS = [
  { periodDays: 7, label: "7 days", short: "7D" },
  { periodDays: 14, label: "2 weeks", short: "2W" },
  { periodDays: 90, label: "3 months", short: "3M" },
] as const;

export type AnalyticsWindow = (typeof ANALYTICS_WINDOWS)[number];

/** The window used for headline "per month" maths and CPM. */
export const BILLING_WINDOW_DAYS = 90;

/** The creator featured on the landing page. */
export async function getPrimaryCreator() {
  const bySlug = await getCreatorBySlug(PRIMARY_CREATOR_SLUG);
  if (bySlug) return bySlug;

  // Fall back to the first active creator so the site still renders if the
  // configured slug is missing.
  const fallback = await prisma.creator.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { slug: true },
  });
  return fallback ? getCreatorBySlug(fallback.slug) : null;
}

export async function listCreators() {
  return prisma.creator.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      placements: { where: { isActive: true } },
      analyticsSnapshots: {
        where: { periodDays: BILLING_WINDOW_DAYS },
        orderBy: { periodEnd: "desc" },
        take: 1,
      },
    },
  });
}

/**
 * Impressions normalised to a 30-day month.
 *
 * CPM and "per month" claims must not be quoted off a 7-day window: a single
 * viral post would inflate the figure several times over. The 90-day window is
 * the honest basis, so it is scaled down to a month.
 */
export function monthlyImpressions(
  snapshot: { impressions: number; periodDays: number } | undefined,
): number {
  if (!snapshot || snapshot.periodDays <= 0) return 0;
  return Math.round((snapshot.impressions / snapshot.periodDays) * 30);
}

/**
 * Picks the most recent snapshot for a rolling window (e.g. 30 or 90 days).
 */
export function snapshotFor<
  T extends { periodDays: number; periodEnd: Date },
>(snapshots: T[], periodDays: number): T | undefined {
  return snapshots
    .filter((s) => s.periodDays === periodDays)
    .sort((a, b) => b.periodEnd.getTime() - a.periodEnd.getTime())[0];
}

/** Groups placements by kind for rendering the inventory sections. */
export function groupPlacements<T extends { kind: string }>(placements: T[]) {
  const out: Record<PlacementKind, T[]> = {
    COVER_SLOT: [],
    BIO_LINK: [],
    PROMO_POST: [],
  };
  for (const placement of placements) {
    const kind = placement.kind as PlacementKind;
    if (out[kind]) out[kind].push(placement);
  }
  return out;
}

/** Lowest monthly price across a creator's inventory, for "from $X" copy. */
export function entryPriceCents(
  placements: { priceMonthlyCents: number }[],
): number {
  if (placements.length === 0) return 0;
  return Math.min(...placements.map((p) => p.priceMonthlyCents));
}
