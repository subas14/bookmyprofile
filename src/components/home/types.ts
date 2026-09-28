/**
 * Shared prop shapes for the landing-page sections.
 *
 * These mirror the Prisma models but are declared structurally so the section
 * components stay decoupled from the database client.
 */

export interface SnapshotView {
  periodDays: number;
  periodStart: Date;
  periodEnd: Date;
  impressions: number;
  profileVisits: number;
  engagements: number;
  followers: number;
  followersGained: number;
  linkClicks: number;
  posts: number;

  // Engagement breakdown, as reported by X Analytics.
  likes: number;
  replies: number;
  reposts: number;
  bookmarks: number;
  shares: number;
  verifiedFollowers: number;
  activeFollowers: number;
  engagementRateBps: number;

  // Period-over-period change in basis points (79700 = +797%). Null when the
  // previous window is not comparable.
  impressionsChangeBps: number | null;
  engagementsChangeBps: number | null;
  engagementRateChangeBps: number | null;
  profileVisitsChangeBps: number | null;
  likesChangeBps: number | null;
  repliesChangeBps: number | null;
  repostsChangeBps: number | null;
  bookmarksChangeBps: number | null;
  sharesChangeBps: number | null;

  source: string;
  isVerified: boolean;
}

/** One day of creator reach, used by the daily bar chart. */
export interface DailyMetricView {
  date: Date;
  impressions: number;
  engagements: number;
  followersDelta: number;
  posts: number;
  replies: number;
}

export interface PlacementView {
  id: string;
  slotKey: string;
  kind: string;
  label: string;
  summary: string;
  details: string;
  priceMonthlyCents: number;
  minMonths: number;
  maxMonths: number;
}

export interface AvailabilityView {
  slotKey: string;
  available: boolean;
  overlapping: number;
  maxConcurrent: number;
  nextAvailableFrom: Date | null;
}

export interface TestimonialView {
  id: string;
  author: string;
  role: string;
  quote: string;
}
