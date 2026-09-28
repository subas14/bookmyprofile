import { Delta, cx } from "@/components/ui";
import { ImpressionsChart } from "@/components/analytics/impressions-chart";
import {
  formatBps,
  formatCompactNumber,
  formatNumber,
  formatRatio,
} from "@/lib/format";
import type { DailyMetricView, SnapshotView } from "@/components/home/types";

/**
 * Dashboard overview for one analytics window.
 *
 * Bento layout: four headline KPIs across the top, then the daily chart taking
 * two thirds of the width with a stacked "highlights" column beside it. All
 * server-rendered; the only client piece is the window selector.
 */
export function DashboardOverview({
  snapshot,
  days,
}: {
  snapshot: SnapshotView;
  days: DailyMetricView[];
}) {
  const perPost = Math.round(snapshot.impressions / Math.max(1, snapshot.posts));
  const verifiedShare = snapshot.followers
    ? snapshot.verifiedFollowers / snapshot.followers
    : 0;
  const activeShare = snapshot.followers
    ? snapshot.activeFollowers / snapshot.followers
    : 0;

  const pct = (bps: number | null) => (bps === null ? null : bps / 100);

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Impressions"
          value={formatCompactNumber(snapshot.impressions)}
          exact={formatNumber(snapshot.impressions)}
          delta={pct(snapshot.impressionsChangeBps)}
          accent
        />
        <Kpi
          label="Engagements"
          value={formatCompactNumber(snapshot.engagements)}
          exact={formatNumber(snapshot.engagements)}
          delta={pct(snapshot.engagementsChangeBps)}
        />
        <Kpi
          label="Engagement rate"
          value={formatBps(snapshot.engagementRateBps)}
          exact="Engagements ÷ impressions"
          delta={pct(snapshot.engagementRateChangeBps)}
        />
        <Kpi
          label="Profile visits"
          value={formatCompactNumber(snapshot.profileVisits)}
          exact={formatNumber(snapshot.profileVisits)}
          delta={pct(snapshot.profileVisitsChangeBps)}
        />
      </dl>

      {/* Chart + highlights */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ImpressionsChart days={days} />
        </div>

        <div className="flex flex-col gap-4">
          <Highlight
            label="Avg. impressions / post"
            value={formatCompactNumber(perPost)}
            note={`Across ${formatNumber(snapshot.posts)} posts`}
          />
          <RingStat
            label="Verified followers"
            share={verifiedShare}
            value={formatCompactNumber(snapshot.verifiedFollowers)}
            of={formatCompactNumber(snapshot.followers)}
            note="Paying for X Premium"
          />
          <RingStat
            label="Active followers"
            share={activeShare}
            value={formatCompactNumber(snapshot.activeFollowers)}
            of={formatCompactNumber(snapshot.followers)}
            note="Seen on X in this window"
          />
          <Highlight
            label="Followers gained"
            value={`+${formatNumber(snapshot.followersGained)}`}
            note="Net new in the window"
            tone="success"
          />
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  exact,
  delta,
  accent,
}: {
  label: string;
  value: string;
  exact: string;
  delta: number | null;
  accent?: boolean;
}) {
  return (
    <div
      className={cx(
        "bmp-lift rounded-2xl border p-5",
        accent
          ? "border-invert-line bg-invert text-invert-fg"
          : "border-line bg-surface",
      )}
    >
      <dt
        className={cx(
          "text-[13px] font-medium",
          accent ? "text-invert-fg/60" : "text-muted",
        )}
      >
        {label}
      </dt>
      <dd className="mt-3 flex items-baseline gap-2.5">
        <span className="text-[2rem] font-bold leading-none tracking-tight tabular-nums">
          {value}
        </span>
        {delta !== null ? <Delta value={delta} /> : null}
      </dd>
      <p
        className={cx(
          "mt-2 text-xs tabular-nums",
          accent ? "text-invert-fg/50" : "text-faint",
        )}
      >
        {exact}
      </p>
    </div>
  );
}

function Highlight({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: "success";
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p
        className={cx(
          "mt-2 text-2xl font-bold tracking-tight tabular-nums",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-faint">{note}</p>
    </div>
  );
}

/** Share of followers as a small ring, with the count beside it. */
function RingStat({
  label,
  share,
  value,
  of,
  note,
}: {
  label: string;
  share: number;
  value: string;
  of: string;
  note: string;
}) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, share));
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-5">
      <svg
        aria-hidden
        width="48"
        height="48"
        viewBox="0 0 48 48"
        className="shrink-0 -rotate-90"
      >
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="var(--subtle-strong)"
          strokeWidth="5"
        />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
        />
      </svg>
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <p className="mt-1 text-xl font-bold tracking-tight tabular-nums">
          {value}{" "}
          <span className="text-sm font-normal text-faint">/ {of}</span>
        </p>
        <p className="mt-0.5 text-xs text-faint">
          {formatRatio(clamped, 1)} · {note}
        </p>
      </div>
    </div>
  );
}
