import type React from "react";
import Link from "next/link";

import { ButtonArrow, ButtonLink, Section, cx } from "@/components/ui";
import { ProfilePreview } from "@/components/profile-preview";
import { formatCompactNumber, formatDate, formatMoney } from "@/lib/format";
import { LAUNCH_SPECIAL } from "@/lib/pricing";
import type { CoverSlotKey } from "@/lib/domain";
import type { SnapshotView } from "@/components/home/types";

/**
 * Hero.
 *
 * The promise and two CTAs on the left with a strip of reach figures beneath;
 * on the right, the profile mock showing exactly what is for sale (both cover
 * halves and the bio links, with live prices and availability). On phones the
 * mock sits directly under the headline. Detailed analytics live on
 * /analytics, not here.
 */
export function HeroSection({
  displayName,
  handle,
  headline,
  avatarUrl,
  profileUrl,
  followerCount,
  billing,
  monthlyImpressions,
  openCount,
  cheapestSlotCents,
  cpm,
  takenSlots,
  bioLinksTaken = 0,
  coverPrices,
  bioLinkPriceCents,
}: {
  displayName: string;
  handle: string;
  headline: string;
  avatarUrl?: string | null;
  profileUrl: string;
  followerCount: number;
  /** 90-day window: the basis for monthly claims. */
  billing?: SnapshotView;
  /** Impressions normalised to a 30-day month. */
  monthlyImpressions: number;
  openCount: number;
  cheapestSlotCents: number;
  cpm: number;
  /** Slot keys fully booked right now, drawn as taken in the mock. */
  takenSlots: string[];
  /** Occupied product-link lines in the bio. */
  bioLinksTaken?: number;
  /** Monthly list price per cover half, printed on each half. */
  coverPrices: Partial<Record<CoverSlotKey, number>>;
  /** Monthly list price of a bio link. */
  bioLinkPriceCents?: number;
}) {
  // Reach figures for the strip under the CTAs. Every value is read from the
  // published snapshot or the live rate card, never typed in.
  const figures = [
    {
      label: "Followers",
      value: formatCompactNumber(followerCount),
    },
    {
      label: "Impressions / month",
      value: formatCompactNumber(monthlyImpressions),
    },
    {
      label: "Impressions · 90d",
      value: formatCompactNumber(billing?.impressions ?? 0),
    },
    {
      label: cpm > 0 ? "Effective CPM" : "From",
      value:
        cpm > 0 ? `$${cpm.toFixed(3)}` : `${formatMoney(cheapestSlotCents)}/mo`,
    },
  ];

  const preview = (
    <div className="relative">
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
        What is for sale: two halves of the cover and up to three product links
        in the bio of{" "}
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-foreground underline-offset-2 hover:underline"
        >
          {handle}
        </a>
        .
      </p>
    </div>
  );

  return (
    <div className="bmp-rule relative overflow-hidden">
      <div aria-hidden className="bmp-grid-bg absolute inset-0" />
      <Section className="pb-12 pt-10 sm:pb-16 sm:pt-16">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
          {/* ---- Pitch ---- */}
          <div className="min-w-0">
            <Reveal delay={0}>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[13px] font-medium">
                <span
                  aria-hidden
                  className={cx(
                    "h-1.5 w-1.5 rounded-full",
                    openCount === 0 ? "bg-danger" : "bmp-live-dot bg-success",
                  )}
                />
                {openCount === 0
                  ? "All placements booked"
                  : `${openCount} placement${openCount === 1 ? "" : "s"} open now`}
              </span>
            </Reveal>

            <Reveal delay={60}>
              <h1 className="mt-6 max-w-2xl text-balance text-[2.4rem] font-extrabold leading-[1.03] tracking-[-0.035em] sm:text-[3.4rem] lg:text-[3.75rem]">
                Put your product in front of a{" "}
                <span className="text-accent">real Tech audience.</span>
              </h1>
            </Reveal>

            <Reveal delay={120}>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
                Book a product link in the bio or half of the cover photo on{" "}
                <span className="font-semibold text-foreground">{handle}</span>,
                a profile followed for tech and AI. Fixed prices, live
                availability, one brand per slot.
              </p>
            </Reveal>

            {/* Placement mock directly under the headline on phones. */}
            <Reveal delay={160} className="mt-10 px-3 sm:px-5 lg:hidden">
              {preview}
            </Reveal>

            <Reveal delay={200} className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href="/book" size="lg">
                Book a placement
                <ButtonArrow />
              </ButtonLink>
              <ButtonLink href="/analytics" variant="secondary" size="lg">
                View analytics
              </ButtonLink>
            </Reveal>

            {LAUNCH_SPECIAL.active ? (
              <Reveal delay={240}>
                <Link
                  href={`/book?slots=${LAUNCH_SPECIAL.slotKey}&term=launch`}
                  className="group mt-4 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted transition-colors hover:text-foreground"
                >
                  <span className="rounded-md bg-accent-wash px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent">
                    Launch special
                  </span>
                  <span>
                    A bio link for 2 weeks,{" "}
                    <strong className="font-semibold tabular-nums text-foreground">
                      {formatMoney(LAUNCH_SPECIAL.priceCents)}
                    </strong>
                  </span>
                  <span
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    &rarr;
                  </span>
                </Link>
              </Reveal>
            ) : null}

            {/* Figure strip: scrolls sideways on narrow phones. */}
            <Reveal delay={300} className="mt-10">
              <dl className="bmp-scroll-x -mx-5 flex gap-2 px-5 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-px sm:overflow-hidden sm:rounded-xl sm:border sm:border-line sm:bg-line sm:px-0">
                {figures.map((figure) => (
                  <div
                    key={figure.label}
                    className="min-w-[8.5rem] shrink-0 rounded-xl border border-line bg-surface px-4 py-3.5 sm:min-w-0 sm:rounded-none sm:border-0"
                  >
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-faint">
                      {figure.label}
                    </dt>
                    <dd className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">
                      {figure.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-faint">
                Source: X Analytics
                {billing
                  ? `, 90-day window ending ${formatDate(billing.periodEnd)}`
                  : ""}
                .
              </p>
            </Reveal>
          </div>

          {/* ---- Placements mock (desktop) ---- */}
          <Reveal delay={140} className="hidden px-5 pt-5 lg:block">
            {preview}
          </Reveal>
        </div>
      </Section>
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

