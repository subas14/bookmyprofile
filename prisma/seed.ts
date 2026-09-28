/**
 * Seeds BookMyProfile with the launch creator, their inventory, and the
 * transparent analytics snapshots advertisers evaluate before booking.
 *
 * Run with: npm run db:seed
 *
 * The analytics figures are the creator-reported X Analytics numbers. Set
 * `proofUrl` to a public screenshot link so every figure on the analytics page
 * is independently checkable.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Rolling-window helper: N days back from `end`, at UTC midnight. */
function daysBefore(end: Date, days: number): Date {
  const date = new Date(end);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function utcDay(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}

/**
 * The launch creator. Profile facts mirror the live public profile at
 * https://x.com/shub0414 so anything an advertiser reads here can be checked
 * against the real account in one click.
 */
const CREATOR = {
  slug: "shub0414",
  handle: "@shub0414",
  displayName: "Shub",
  headline: "Tech | AI | sharing thoughts, trends and facts.",
  bio:
    "Tech, AI and the trends actually worth paying attention to. My audience " +
    "is builders, engineers and early adopters who try new tools, not " +
    "passive scrollers.",
  profileUrl: "https://x.com/shub0414",
  /** Served from /public; the same picture as the live X profile. */
  avatarUrl: "/shub-avatar.jpg",
  platform: "x",
  timezone: "UTC",
  isVerified: true,
  followerCount: 7_000,
  followingCount: 1_682,
  totalPosts: 33_200,
  location: "DM for work/collabs",
  joinedAt: new Date(Date.UTC(2023, 2, 1)),
  /** Promo post list price; discounted 30% when bundled with a placement. */
  promoPostPriceCents: 24_900,
};

const COVER_SLOTS = [
  {
    slotKey: "cover-left",
    label: "Cover · Left half",
    summary: "The left half of my X cover photo, one brand at full height.",
    details:
      "The cover is split straight down the middle and this entire left half " +
      "is yours: logo, product name and a one-line tagline rendered at full " +
      "resolution, visible on desktop and mobile to everyone who opens the " +
      "profile. It sits directly above my avatar, the first thing the eye " +
      "lands on.",
    sortOrder: 1,
  },
  {
    slotKey: "cover-right",
    label: "Cover · Right half",
    summary: "The right half of my X cover photo, one brand at full height.",
    details:
      "The entire right half of the cover, closest to the Follow button. " +
      "Same size and treatment as the left half; book both for the whole " +
      "cover and a bundle discount applies automatically.",
    sortOrder: 2,
  },
];

/** Monthly list prices. Term discounts are applied by the pricing engine. */
const COVER_HALF_PRICE_CENTS = 9_900; // $99 / month
const BIO_LINK_PRICE_CENTS = 8_900; // $89 / month

async function seedInventory(creatorId: string) {
  for (const slot of COVER_SLOTS) {
    const data = {
      ...slot,
      kind: "COVER_SLOT",
      priceMonthlyCents: COVER_HALF_PRICE_CENTS,
      maxConcurrent: 1,
      minMonths: 1,
      maxMonths: 12,
      isActive: true,
    };
    await prisma.placement.upsert({
      where: { creatorId_slotKey: { creatorId, slotKey: slot.slotKey } },
      update: data,
      create: { ...data, creatorId },
    });
  }

  const bioLink = {
    slotKey: "bio-link",
    kind: "BIO_LINK",
    label: "Product link in bio",
    summary:
      "Your product URL in my bio, one line of copy, up to three brands at a time.",
    details:
      "Your product URL goes into my profile bio with a short line of copy we " +
      "agree together, so anyone who opens the profile can tap straight " +
      "through. The bio holds up to three product links at once, so you get " +
      "your own line, never rotated or shared. This is the highest-intent " +
      "placement I sell.",
    priceMonthlyCents: BIO_LINK_PRICE_CENTS,
    /** Three product links live in the bio at the same time. */
    maxConcurrent: 3,
    minMonths: 1,
    maxMonths: 12,
    sortOrder: 0,
    isActive: true,
  };
  await prisma.placement.upsert({
    where: { creatorId_slotKey: { creatorId, slotKey: bioLink.slotKey } },
    update: bioLink,
    create: { ...bioLink, creatorId },
  });

  const promoPost = {
    slotKey: "promo-post",
    kind: "PROMO_POST",
    label: "Dedicated Promo Post",
    summary: "A standalone post about your product, written in my voice.",
    details:
      "A dedicated post introducing your product to my audience, kept live " +
      "permanently and pinned for the first 24 hours. Add it to any placement " +
      "booking for 30% off the standalone price.",
    priceMonthlyCents: CREATOR.promoPostPriceCents,
    maxConcurrent: 4,
    minMonths: 1,
    maxMonths: 12,
    sortOrder: 5,
    isActive: true,
  };
  await prisma.placement.upsert({
    where: { creatorId_slotKey: { creatorId, slotKey: promoPost.slotKey } },
    update: promoPost,
    create: { ...promoPost, creatorId },
  });

  // Retire any placement no longer on the rate card (e.g. the old four
  // cover quadrants). Deactivated rather than deleted so historical bookings
  // keep their foreign key.
  const liveKeys = [
    ...COVER_SLOTS.map((slot) => slot.slotKey),
    bioLink.slotKey,
    promoPost.slotKey,
  ];
  await prisma.placement.updateMany({
    where: { creatorId, slotKey: { notIn: liveKeys } },
    data: { isActive: false },
  });

  return COVER_SLOTS.length + 2;
}

/**
 * Real X Analytics figures for @shub0414, transcribed from the native
 * "Account overview" dashboard on 19 Sep 2026.
 *
 * Three windows are published: 7 days (current form), 14 days (a smoothing
 * window that spans more than one viral post), and 3 months (whether it holds
 * up over time). The `*ChangeBps` fields are the period-over-period deltas X
 * displays next to each figure, in basis points (79700 = +797%).
 *
 * `followers` is the account total at capture time, not a per-window number.
 */
const SNAPSHOTS = [
  {
    periodDays: 7,
    label: "7 days",
    impressions: 3_800_000,
    impressionsChangeBps: 79_700,
    profileVisits: 2_600,
    profileVisitsChangeBps: 20_500,
    engagements: 46_700,
    engagementsChangeBps: 33_500,
    engagementRateBps: 120,
    engagementRateChangeBps: -5_100,
    followers: 6_890,
    followersGained: 316,
    verifiedFollowers: 1_800,
    activeFollowers: 4_900,
    likes: 35_900,
    likesChangeBps: 38_500,
    replies: 2_000,
    repliesChangeBps: 4_300,
    reposts: 1_700,
    repostsChangeBps: 42_100,
    bookmarks: 2_900,
    bookmarksChangeBps: 41_800,
    shares: 800,
    sharesChangeBps: 26_000,
    linkClicks: 1_040,
    posts: 7,
  },
  {
    periodDays: 14,
    label: "2 weeks",
    impressions: 4_200_000,
    impressionsChangeBps: 4_100,
    profileVisits: 3_400,
    profileVisitsChangeBps: 5_900,
    engagements: 57_400,
    engagementsChangeBps: -4_800,
    engagementRateBps: 130,
    engagementRateChangeBps: -6_300,
    followers: 6_890,
    followersGained: 402,
    verifiedFollowers: 1_800,
    activeFollowers: 4_900,
    likes: 43_300,
    likesChangeBps: -5_400,
    replies: 3_500,
    repliesChangeBps: 740,
    reposts: 2_100,
    repostsChangeBps: -5_400,
    bookmarks: 3_500,
    bookmarksChangeBps: -2_700,
    shares: 1_300,
    sharesChangeBps: 4_100,
    linkClicks: 1_360,
    posts: 14,
  },
  {
    periodDays: 90,
    label: "3 months",
    impressions: 22_100_000,
    impressionsChangeBps: 490,
    profileVisits: 18_000,
    profileVisitsChangeBps: -980,
    engagements: 469_600,
    engagementsChangeBps: 4_600,
    engagementRateBps: 210,
    engagementRateChangeBps: 3_900,
    followers: 6_890,
    followersGained: 2_140,
    verifiedFollowers: 1_800,
    activeFollowers: 4_900,
    likes: 379_200,
    likesChangeBps: 7_100,
    replies: 23_000,
    repliesChangeBps: 90,
    reposts: 14_600,
    repostsChangeBps: -3_000,
    bookmarks: 29_200,
    bookmarksChangeBps: -550,
    shares: 9_800,
    sharesChangeBps: 1_200,
    linkClicks: 7_200,
    posts: 92,
  },
];

async function seedAnalytics(creatorId: string) {
  const periodEnd = utcDay(new Date());

  for (const entry of SNAPSHOTS) {
    // `label` is presentation-only; the UI derives it from periodDays instead.
    const snapshot: Omit<typeof entry, "label"> & { label?: string } = {
      ...entry,
    };
    delete snapshot.label;
    const data = {
      ...snapshot,
      periodStart: daysBefore(periodEnd, snapshot.periodDays),
      source: "X Analytics",
      isVerified: true,
    };
    await prisma.analyticsSnapshot.upsert({
      where: {
        creatorId_periodDays_periodEnd: {
          creatorId,
          periodDays: snapshot.periodDays,
          periodEnd,
        },
      },
      update: data,
      create: { ...data, creatorId, periodEnd },
    });
  }

  return SNAPSHOTS.length;
}

/**
 * Daily impressions for the last 14 days, read off the X Analytics daily bar
 * chart. Values are the visible bar heights; the two spikes (Sep 13 and Sep 18)
 * are individual posts that broke out.
 *
 * Index 0 is the oldest day. The array is anchored to "today" at seed time so
 * the chart always shows a trailing window.
 */
const DAILY_IMPRESSIONS = [
  { impressions: 60_000, followersDelta: 6, posts: 1, replies: 114 },
  { impressions: 170_000, followersDelta: 5, posts: 1, replies: 82 },
  { impressions: 110_000, followersDelta: 4, posts: 1, replies: 165 },
  { impressions: 120_000, followersDelta: 3, posts: 1, replies: 98 },
  { impressions: 70_000, followersDelta: 2, posts: 1, replies: 77 },
  { impressions: 80_000, followersDelta: -1, posts: 1, replies: 73 },
  { impressions: 25_000, followersDelta: 3, posts: 1, replies: 118 },
  { impressions: 1_740_000, followersDelta: 57, posts: 1, replies: 66 },
  { impressions: 95_000, followersDelta: 9, posts: 1, replies: 106 },
  { impressions: 55_000, followersDelta: 4, posts: 1, replies: 101 },
  { impressions: 80_000, followersDelta: -6, posts: 1, replies: 96 },
  { impressions: 190_000, followersDelta: 40, posts: 1, replies: 108 },
  { impressions: 1_560_000, followersDelta: 92, posts: 1, replies: 131 },
  { impressions: 255_000, followersDelta: 56, posts: 1, replies: 78 },
];

async function seedDailyMetrics(creatorId: string) {
  await prisma.creatorDailyMetric.deleteMany({ where: { creatorId } });

  const today = utcDay(new Date());
  const rows = DAILY_IMPRESSIONS.map((day, index) => ({
    creatorId,
    // The last entry lands on today; earlier entries walk backwards.
    date: daysBefore(today, DAILY_IMPRESSIONS.length - 1 - index),
    impressions: day.impressions,
    // Engagement tracks impressions at roughly the reported blended rate.
    engagements: Math.round(day.impressions * 0.013),
    followersDelta: day.followersDelta,
    posts: day.posts,
    replies: day.replies,
  }));

  await prisma.creatorDailyMetric.createMany({ data: rows });
  return rows.length;
}

/**
 * Audience composition in basis points (10000 = 100%), taken from the X
 * Analytics "Audience" tab (3-month window, measured on likers).
 *
 * Only categories X actually reports are stored: age, gender and country.
 * Inventing "role" or "interest" splits would undercut the whole point of
 * publishing verifiable numbers.
 */
async function seedAudience(creatorId: string) {
  await prisma.audienceSegment.deleteMany({ where: { creatorId } });
  await prisma.audienceSegment.createMany({
    data: [
      // Age bands
      { creatorId, category: "age", label: "13–17", shareBps: 600, sortOrder: 1 },
      { creatorId, category: "age", label: "18–24", shareBps: 3970, sortOrder: 2 },
      { creatorId, category: "age", label: "25–34", shareBps: 4130, sortOrder: 3 },
      { creatorId, category: "age", label: "35–44", shareBps: 860, sortOrder: 4 },
      { creatorId, category: "age", label: "45–54", shareBps: 220, sortOrder: 5 },
      { creatorId, category: "age", label: "55–64", shareBps: 90, sortOrder: 6 },
      { creatorId, category: "age", label: "65+", shareBps: 130, sortOrder: 7 },

      // Gender (X notes this may be inferred)
      { creatorId, category: "gender", label: "Male", shareBps: 7990, sortOrder: 1 },
      { creatorId, category: "gender", label: "Female", shareBps: 1910, sortOrder: 2 },
      { creatorId, category: "gender", label: "Not specified", shareBps: 100, sortOrder: 3 },

      // Geography
      { creatorId, category: "country", label: "United States", shareBps: 2540, sortOrder: 1 },
      { creatorId, category: "country", label: "India", shareBps: 1350, sortOrder: 2 },
      { creatorId, category: "country", label: "Brazil", shareBps: 540, sortOrder: 3 },
      { creatorId, category: "country", label: "United Kingdom", shareBps: 430, sortOrder: 4 },
      { creatorId, category: "country", label: "Mexico", shareBps: 400, sortOrder: 5 },
      { creatorId, category: "country", label: "Other", shareBps: 4740, sortOrder: 6 },
    ],
  });
}

/**
 * Advertiser testimonials.
 *
 * Intentionally empty: this site's whole pitch is verifiable numbers, so it
 * ships with no invented social proof. The landing page hides the section when
 * there are no published testimonials. Add real ones (with the advertiser's
 * permission) as campaigns complete.
 */
async function seedTestimonials(creatorId: string) {
  await prisma.testimonial.deleteMany({ where: { creatorId } });
  return 0;
}

async function main() {
  console.log("Seeding BookMyProfile…");

  const creator = await prisma.creator.upsert({
    where: { slug: CREATOR.slug },
    update: CREATOR,
    create: CREATOR,
  });

  const placements = await seedInventory(creator.id);
  const snapshots = await seedAnalytics(creator.id);
  const days = await seedDailyMetrics(creator.id);
  await seedAudience(creator.id);
  await seedTestimonials(creator.id);

  console.log("Seed complete:");
  console.log(`  creator     ${creator.handle} (${creator.slug})`);
  console.log(`  placements  ${placements}`);
  console.log(`  snapshots   ${snapshots}`);
  console.log(`  daily rows  ${days}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
