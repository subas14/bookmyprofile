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

export async function getCreatorBySlug(slug: string) {
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
