import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge, ButtonArrow, ButtonLink, Section } from "@/components/ui";
import { CreatorAvatar } from "@/components/creator-avatar";
import { MetricGrid } from "@/components/analytics/metric-grid";
import { DashboardOverview } from "@/components/analytics/dashboard-overview";
import { WindowTabs } from "@/components/analytics/window-tabs";
import { AudienceBreakdown } from "@/components/analytics/audience-breakdown";
import { CpmTable } from "@/components/analytics/cpm-table";
import { MethodologySection } from "@/components/analytics/methodology-section";
import { WalkthroughVideo } from "@/components/analytics/walkthrough-video";
import {
  ANALYTICS_WINDOWS,
  BILLING_WINDOW_DAYS,
  getPrimaryCreator,
  monthlyImpressions,
  snapshotFor,
} from "@/server/creators";
import {
  formatCompactNumber,
  formatDate,
  formatDateRange,
  formatMoney,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Audience analytics",
  description:
    "The full X Analytics numbers for @shub0414: impressions, engagement " +
    "rate, profile visits, follower quality and audience composition across " +
    "7-day, 2-week and 3-month windows, plus the effective CPM of every " +
    "placement.",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const creator = await getPrimaryCreator();
  if (!creator) notFound();

  const { window: requested } = await searchParams;

  // Resolve the requested window, falling back to the 7-day view. Only windows
  // we actually publish are selectable, so a bogus query string cannot 500.
  const requestedDays = Number(requested);
  const selected =
    ANALYTICS_WINDOWS.find((w) => w.periodDays === requestedDays) ??
    ANALYTICS_WINDOWS[0];

  const snapshot = snapshotFor(creator.analyticsSnapshots, selected.periodDays);
  const billing = snapshotFor(creator.analyticsSnapshots, BILLING_WINDOW_DAYS);
  const perMonth = monthlyImpressions(billing);

  const sellable = creator.placements
    .filter((placement) => placement.kind !== "PROMO_POST")
    .sort((a, b) => a.priceMonthlyCents - b.priceMonthlyCents);

  const cheapestLabel = sellable[0]
    ? formatMoney(sellable[0].priceMonthlyCents)
    : "$89";

  return (
    <>
      {/* ---- Page header ---- */}
      <div className="bmp-rule bg-panel">
        <Section className="py-10 sm:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <CreatorAvatar
                src={creator.avatarUrl}
                name={creator.displayName}
                size={56}
                className="ring-2 ring-line"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                    {creator.displayName}
                  </h1>
                  <Badge>{creator.handle}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{creator.headline}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <Badge tone="success">
                    <span
                      aria-hidden
                      className="bmp-live-dot h-1.5 w-1.5 rounded-full bg-success"
                    />
                    Source: X Analytics
                  </Badge>
                  {snapshot ? (
                    <span className="text-xs text-muted">
                      Captured {formatDate(snapshot.periodEnd)}
                    </span>
                  ) : null}
                  <a
                    href={creator.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-accent underline-offset-2 hover:underline"
                  >
                    Verify on X ↗
                  </a>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 lg:items-end">
              <WindowTabs
                windows={ANALYTICS_WINDOWS}
                active={selected.periodDays}
              />
              {snapshot ? (
                <p className="text-xs tabular-nums text-muted">
                  {formatDateRange(snapshot.periodStart, snapshot.periodEnd)}
                </p>
              ) : null}
            </div>
          </div>
        </Section>
      </div>

      {/* ---- Dashboard ---- */}
      <Section className="py-10 sm:py-12">
        {snapshot ? (
          <div className="space-y-4">
            <DashboardOverview snapshot={snapshot} days={creator.dailyMetrics} />
            <MetricGrid snapshot={snapshot} full={false} />
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-line bg-surface p-8 text-center text-sm text-muted">
            No snapshot has been published for this window yet.
          </p>
        )}

        <p className="mt-6 max-w-3xl text-xs leading-relaxed text-muted">
          Impressions are spiky by nature: a single post that breaks out can
          carry a whole week. That is why three windows are published rather
          than one. The 7-day view shows current form, the 3-month view shows
          what actually repeats.
        </p>
      </Section>

      {/* ---- Effective CPM ---- */}
      {perMonth > 0 ? (
        <CpmTable
          placements={sellable.map((placement) => ({
            id: placement.id,
            label: placement.label,
            priceMonthlyCents: placement.priceMonthlyCents,
          }))}
          monthlyImpressions={perMonth}
          basisPeriodDays={BILLING_WINDOW_DAYS}
        />
      ) : null}

      {/* ---- Audience composition ---- */}
      <Section id="audience" className="py-12 sm:py-14">
        <div className="max-w-3xl">
          <h2 className="text-xl font-bold">Who is on the other side</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            Taken from the X Analytics Audience tab over a 3-month window. Only
            the categories X reports are shown, with no invented job titles or
            purchase-intent scores.
          </p>
        </div>
        <div className="mt-8">
          <AudienceBreakdown segments={creator.audienceSegments} />
        </div>
      </Section>

      {/* ---- Proof: screen-recorded dashboard walkthrough ---- */}
      <WalkthroughVideo handle={creator.handle} />

      {/* ---- Verify ---- */}
      <MethodologySection
        profileUrl={creator.profileUrl}
        handle={creator.handle}
      />

      {/* ---- Close ---- */}
      <div className="border-t border-line">
        <Section className="py-14 text-center">
          <h2 className="mx-auto max-w-2xl text-balance text-2xl font-bold sm:text-3xl">
            {perMonth > 0
              ? `Roughly ${formatCompactNumber(
                  perMonth,
                )} impressions a month, from ${cheapestLabel}.`
              : `Placements start at ${cheapestLabel} a month.`}
          </h2>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/book" size="lg">
              Book a placement
              <ButtonArrow />
            </ButtonLink>
            <ButtonLink href="/pricing" variant="secondary" size="lg">
              See pricing
            </ButtonLink>
          </div>
        </Section>
      </div>
    </>
  );
}
