import type React from "react";
import Link from "next/link";

import { ButtonArrow, ButtonLink, Section, cx } from "@/components/ui";
import { ProfilePreview } from "@/components/profile-preview";
import { CreatorAvatar } from "@/components/creator-avatar";
import { formatCompactNumber, formatMoney, formatNumber } from "@/lib/format";
import { LAUNCH_SPECIAL } from "@/lib/pricing";
import type { DailyMetricView, SnapshotView } from "@/components/home/types";

/**
 * Hero.
 *
 * Split editorial layout: the pitch on the left (availability chip, one hard
 * claim with a real number in it, two CTAs, creator card), the product on the
 * right (the profile mock showing exactly what is for sale). Content reveals
 * in a short stagger; a marquee of verifiable proof figures runs underneath.
 */
export function HeroSection({
  displayName,
  handle,
  headline,
  bio,
  avatarUrl,
  location,
  joinedAt,
  profileUrl,
  followerCount,
  totalPosts,
  recent,
  billing,
  daily,
  monthlyImpressions,
  openCount,
  takenSlots,
  bioLinksTaken = 0,
  cheapestSlotCents,
  cpm,
  coverPrices,
  coverPriceCents,
  bioLinkPriceCents,
}: {
  displayName: string;
  handle: string;
  headline: string;
  bio: string;
  avatarUrl?: string | null;
  location?: string | null;
  joinedAt?: Date | null;
  profileUrl: string;
  followerCount: number;
  totalPosts: number;
  /** Recent daily impressions, drawn as a sparkline in the creator card. */
  daily: DailyMetricView[];
  /** 7-day window: current form. */
  recent?: SnapshotView;
  /** 90-day window: the basis for monthly claims. */
  billing?: SnapshotView;
  /** Impressions normalised to a 30-day month. */
  monthlyImpressions: number;
  openCount: number;
  takenSlots: string[];
  /** Occupied product-link lines in the bio (of three). */
  bioLinksTaken?: number;
  cheapestSlotCents: number;
  cpm: number;
  /** Monthly list price keyed by cover slot, printed on the preview. */
  coverPrices?: Record<string, number>;
  coverPriceCents?: number;
  bioLinkPriceCents?: number;
}) {
  const proof = [
    { label: "Impressions · 90 days", value: formatCompactNumber(billing?.impressions ?? 0) },
    { label: "Impressions · 7 days", value: formatCompactNumber(recent?.impressions ?? 0) },
    { label: "Engagements · 90 days", value: formatCompactNumber(billing?.engagements ?? 0) },
    { label: "Followers", value: `${formatNumber(followerCount)}+` },
    { label: "Posts published", value: `${formatCompactNumber(totalPosts)}+` },
    { label: "Impressions / month", value: formatCompactNumber(monthlyImpressions) },
    { label: "Cheapest slot", value: `${formatMoney(cheapestSlotCents)}/mo` },
    { label: "Bio product links", value: "Up to 3 at once" },
    ...(cpm > 0 ? [{ label: "Effective CPM", value: `$${cpm.toFixed(3)}` }] : []),
  ];

  return (
    <div className="bmp-rule overflow-hidden">
      <Section className="pb-12 pt-12 sm:pb-16 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          {/* ---- Pitch ---- */}
          <div>
            <Reveal delay={0} className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] font-medium">
                <span
                  aria-hidden
                  className="bmp-live-dot h-1.5 w-1.5 rounded-full bg-success"
                />
                {openCount === 0
                  ? "All placements booked"
                  : `${openCount} placement${openCount === 1 ? "" : "s"} open right now`}
              </span>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:border-line-strong hover:text-foreground"
              >
                <XGlyph />
                {handle}
              </a>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="mt-7 max-w-2xl text-balance text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-[3.6rem] lg:text-[4rem]">
                Put your product in front of{" "}
                <span className="relative inline-block whitespace-nowrap text-accent">
                  {formatCompactNumber(billing?.impressions ?? 0)} impressions
                  <svg
                    aria-hidden
                    viewBox="0 0 200 8"
                    preserveAspectRatio="none"
                    className="absolute -bottom-1 left-0 h-2 w-full text-accent/50"
                  >
                    <path
                      d="M2 5.5C40 2 80 2 120 4.5S180 6 198 3"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>{" "}
                every 90 days.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted">
                Half of the cover photo
                {coverPriceCents ? ` for ${formatMoney(coverPriceCents)}` : ""}, or
                your product link in the bio of {handle}
                {bioLinkPriceCents ? ` for ${formatMoney(bioLinkPriceCents)}` : ""}{" "}
                a month. One brand per slot, the price published, and the
                analytics in full before you spend anything.
              </p>
            </Reveal>

            {LAUNCH_SPECIAL.active ? (
              <Reveal delay={200}>
                <Link
                  href={`/book?slots=${LAUNCH_SPECIAL.slotKey}&term=launch`}
                  className="bmp-option group mt-6 inline-flex max-w-xl items-center gap-3 rounded-2xl border border-dashed border-accent/60 bg-accent-wash py-2 pl-2 pr-4"
                >
                  <span className="rounded-xl bg-accent px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-accent-fg">
                    Launch special
                  </span>
                  <span className="text-sm">
                    <strong className="font-bold tabular-nums">
                      {formatMoney(LAUNCH_SPECIAL.priceCents)}
                    </strong>{" "}
                    <span className="text-muted">
                      for 2 weeks of a link in bio
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="text-accent transition-transform group-hover:translate-x-0.5"
                  >
                    &rarr;
                  </span>
                </Link>
              </Reveal>
            ) : null}

            <Reveal delay={240} className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/book" size="lg">
                Book a placement
                <ButtonArrow />
              </ButtonLink>
              <ButtonLink href="/analytics" variant="secondary" size="lg">
                See the numbers
                <ButtonArrow />
              </ButtonLink>
            </Reveal>

            <Reveal delay={300}>
              <p className="mt-4 text-sm text-muted">
                From{" "}
                <strong className="font-semibold text-foreground">
                  {formatMoney(cheapestSlotCents)}/month
                </strong>
                {cpm > 0 ? (
                  <>
                    {", about "}
                    <strong className="font-semibold text-foreground">
                      ${cpm.toFixed(3)} CPM
                    </strong>
                    . X Ads rarely clears $5.
                  </>
                ) : null}
              </p>
            </Reveal>

            <Reveal delay={380} className="mt-9">
              <CreatorCard
                displayName={displayName}
                handle={handle}
                bio={bio}
                avatarUrl={avatarUrl}
                location={location}
                joinedAt={joinedAt}
                profileUrl={profileUrl}
                followerCount={followerCount}
                daily={daily}
              />
            </Reveal>
          </div>

          {/* ---- Product ---- */}
          <Reveal delay={200} className="relative">
            {/* Backing plate so the mock reads as an object on the page. */}
            <div
              aria-hidden
              className="absolute -inset-3 -z-10 rounded-[1.75rem] bg-panel sm:-inset-5"
            />
            <div
              aria-hidden
              className="bmp-paper absolute -inset-3 -z-10 rounded-[1.75rem] sm:-inset-5"
            />
            <ProfilePreview
              displayName={displayName}
              handle={handle}
              headline={headline}
              avatarUrl={avatarUrl}
              takenSlots={takenSlots}
              bioLinksTaken={bioLinksTaken}
              coverPrices={coverPrices}
              bioLinkPriceCents={bioLinkPriceCents}
            />
            <p className="mt-4 text-center text-xs text-muted sm:mt-5">
              What is for sale: two halves of the cover and up to three product
              links in the bio.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* ---- Proof marquee ---- */}
      <Reveal delay={460} className="border-t border-line bg-surface">
        <div className="bmp-fade-x overflow-hidden py-4">
          <ul className="bmp-marquee" aria-label="Verified profile figures">
            {[...proof, ...proof].map((item, index) => (
              <li
                key={`${item.label}-${index}`}
                aria-hidden={index >= proof.length}
                className="flex items-baseline gap-2.5 px-7"
              >
                <span className="text-xl font-bold tabular-nums tracking-tight">
                  {item.value}
                </span>
                <span className="text-[13px] text-muted">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}

/** Staggered fade-up wrapper; `delay` in ms. */
function Reveal({
  delay,
  className,
  children,
}: {
  delay: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx("bmp-reveal", className)}
      style={{ "--delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

/** The creator behind the inventory: avatar, bio, facts and recent form. */
function CreatorCard({
  displayName,
  handle,
  bio,
  avatarUrl,
  location,
  joinedAt,
  profileUrl,
  followerCount,
  daily,
}: {
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl?: string | null;
  location?: string | null;
  joinedAt?: Date | null;
  profileUrl: string;
  followerCount: number;
  daily: DailyMetricView[];
}) {
  const recentTotal = daily.reduce((sum, day) => sum + day.impressions, 0);
  const joined = joinedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(joinedAt)
    : null;

  return (
    <div className="bmp-lift flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
      <CreatorAvatar
        src={avatarUrl}
        name={displayName}
        size={56}
        className="ring-2 ring-line"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[15px] font-bold tracking-tight">{displayName}</p>
          <VerifiedGlyph />
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            {handle}
          </a>
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted">
          {bio}
        </p>
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-faint">
          <span>{formatNumber(followerCount)}+ followers</span>
          {location ? <span>{location}</span> : null}
          {joined ? <span>Joined {joined}</span> : null}
        </p>
      </div>
      {daily.length > 1 ? (
        <div className="shrink-0 border-t border-line pt-3 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <p className="text-[11px] font-medium text-muted">
            Last {daily.length} days
          </p>
          <Sparkline days={daily} />
          <p className="mt-1 text-xs font-semibold tabular-nums">
            {formatCompactNumber(recentTotal)}{" "}
            <span className="font-normal text-muted">impressions</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Tiny impressions sparkline that draws itself in on load. */
function Sparkline({ days }: { days: DailyMetricView[] }) {
  const width = 120;
  const height = 32;
  const peak = Math.max(1, ...days.map((day) => day.impressions));
  const step = width / (days.length - 1);
  const points = days.map((day, index) => {
    const x = index * step;
    const y = height - (day.impressions / peak) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M${points.join(" L")}`;
  const area = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg
      aria-hidden
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mt-1 block overflow-visible"
    >
      <path d={area} fill="var(--accent)" opacity="0.12" />
      <path
        d={path}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        className="bmp-sparkline"
      />
    </svg>
  );
}

function XGlyph() {
  return (
    <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.2 2h3.4l-7.4 8.5L23 22h-6.8l-5.3-7-6.1 7H1.4l7.9-9.1L1 2h7l4.8 6.4L18.2 2Zm-1.2 18h1.9L7.1 3.9H5.1L17 20Z" />
    </svg>
  );
}

function VerifiedGlyph() {
  return (
    <svg
      aria-label="Verified"
      role="img"
      width="15"
      height="15"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="text-accent"
    >
      <path d="M10 1.2 12 3l2.6-.3 1 2.5 2.3 1.3-.7 2.5.7 2.5-2.3 1.3-1 2.5-2.6-.3-2 1.8-2-1.8-2.6.3-1-2.5L1.1 12l.7-2.5L1.1 7l2.3-1.3 1-2.5L7 3.5l3-2.3Z" />
      <path
        d="m6.8 10.2 2 2 4.4-4.4"
        stroke="var(--surface)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
