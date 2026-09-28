import { StatCard } from "@/components/ui";
import {
  formatBps,
  formatCompactNumber,
  formatNumber,
} from "@/lib/format";
import type { SnapshotView } from "@/components/home/types";

/**
 * The full metric set for one window, laid out the same way X Analytics lays it
 * out, headline reach first, then the engagement breakdown, so an advertiser
 * can check it against the source dashboard line by line.
 */

/** Basis points to a percentage number, for the Delta chips. */
function pct(bps: number | null): number | null {
  return bps === null ? null : bps / 100;
}

export function MetricGrid({
  snapshot,
  full = true,
}: {
  snapshot: SnapshotView;
  /**
   * When false, only the engagement breakdown is rendered, so the headline
   * KPIs are shown by `DashboardOverview` instead.
   */
  full?: boolean;
}) {
  const perPost = Math.round(
    snapshot.impressions / Math.max(1, snapshot.posts),
  );

  return (
    <div className="space-y-4">
      {full ? (
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Impressions"
            value={formatCompactNumber(snapshot.impressions)}
            delta={pct(snapshot.impressionsChangeBps)}
            hint={`${formatNumber(snapshot.impressions)} exactly`}
            emphasis
          />
          <StatCard
            label="Engagements"
            value={formatCompactNumber(snapshot.engagements)}
            delta={pct(snapshot.engagementsChangeBps)}
            hint={`${formatNumber(snapshot.engagements)} exactly`}
            emphasis
          />
          <StatCard
            label="Engagement rate"
            value={formatBps(snapshot.engagementRateBps)}
            delta={pct(snapshot.engagementRateChangeBps)}
            hint="Engagements ÷ impressions"
            emphasis
          />
          <StatCard
            label="Profile visits"
            value={formatCompactNumber(snapshot.profileVisits)}
            delta={pct(snapshot.profileVisitsChangeBps)}
            hint="People who opened the profile"
          />
          <StatCard
            label="Verified followers"
            value={formatCompactNumber(snapshot.verifiedFollowers)}
            sub={formatCompactNumber(snapshot.followers)}
            hint="Followers paying for X Premium"
          />
          <StatCard
            label="Active followers"
            value={formatCompactNumber(snapshot.activeFollowers)}
            sub={formatCompactNumber(snapshot.followers)}
            hint="Seen on the platform in this window"
          />
        </dl>
      ) : null}

      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h3 className="text-base font-bold">Engagement breakdown</h3>
        <p className="mt-1 text-xs text-muted">
          What the {formatCompactNumber(snapshot.engagements)} engagements were
          actually made of.
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <BreakdownItem
            label="Likes"
            value={snapshot.likes}
            deltaBps={snapshot.likesChangeBps}
          />
          <BreakdownItem
            label="Replies"
            value={snapshot.replies}
            deltaBps={snapshot.repliesChangeBps}
          />
          <BreakdownItem
            label="Reposts"
            value={snapshot.reposts}
            deltaBps={snapshot.repostsChangeBps}
          />
          <BreakdownItem
            label="Bookmarks"
            value={snapshot.bookmarks}
            deltaBps={snapshot.bookmarksChangeBps}
          />
          <BreakdownItem
            label="Shares"
            value={snapshot.shares}
            deltaBps={snapshot.sharesChangeBps}
          />
        </dl>

        <dl className="mt-6 grid gap-x-8 gap-y-3 border-t border-line pt-5 text-sm sm:grid-cols-3">
          <Row label="Posts published" value={formatNumber(snapshot.posts)} />
          <Row
            label="Avg. impressions / post"
            value={formatCompactNumber(perPost)}
          />
          <Row
            label="Followers gained"
            value={`+${formatNumber(snapshot.followersGained)}`}
            tone="success"
          />
        </dl>
      </div>
    </div>
  );
}

function BreakdownItem({
  label,
  value,
  deltaBps,
}: {
  label: string;
  value: number;
  deltaBps: number | null;
}) {
  return (
    <div className="rounded-xl bg-subtle p-4">
      <dt className="text-[13px] font-medium text-muted">{label}</dt>
      <dd className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
        <span className="text-xl font-bold tabular-nums">
          {formatCompactNumber(value)}
        </span>
        {deltaBps !== null ? <DeltaInline bps={deltaBps} /> : null}
      </dd>
    </div>
  );
}

/** Compact delta chip; duplicated locally to keep the grid self-contained. */
function DeltaInline({ bps }: { bps: number }) {
  const value = bps / 100;
  const up = value >= 0;
  const magnitude = Math.abs(value);
  return (
    <span
      className={[
        "text-[11px] font-semibold tabular-nums",
        up ? "text-success" : "text-danger",
      ].join(" ")}
    >
      <span aria-hidden>{up ? "↑" : "↓"}</span>{" "}
      {up ? "" : "-"}
      {magnitude >= 10 ? Math.round(magnitude) : magnitude.toFixed(1)}%
    </span>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 sm:justify-start sm:gap-2">
      <dt className="text-muted">{label}</dt>
      <dd
        className={[
          "font-semibold tabular-nums",
          tone === "success" ? "text-success" : "",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
