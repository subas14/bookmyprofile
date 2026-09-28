import { formatCompactNumber, formatNumber } from "@/lib/format";
import type { DailyMetricView } from "@/components/home/types";

/**
 * Daily impressions, drawn as a pure-CSS bar chart.
 *
 * Deliberately dependency-free: a charting library would add ~50kB of client JS
 * to a page that only needs 14 static columns. The chart is server-rendered and
 * carries a table-equivalent label for screen readers.
 */

const DAY_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** Rounds a max value up to a clean axis ceiling (1.8M, 450K, ...). */
function axisCeiling(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / (magnitude / 2)) * (magnitude / 2);
}

export function ImpressionsChart({ days }: { days: DailyMetricView[] }) {
  if (days.length === 0) return null;

  const peak = Math.max(...days.map((day) => day.impressions));
  const ceiling = axisCeiling(peak);
  const ticks = [ceiling, ceiling * 0.5, 0];
  const total = days.reduce((sum, day) => sum + day.impressions, 0);

  return (
    <figure className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <h3 className="text-base font-bold">Impressions per day</h3>
          <p className="mt-1 text-xs text-muted">
            Last {days.length} days · {formatNumber(total)} impressions total
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <span aria-hidden className="h-2 w-2 rounded-sm bg-accent" />
          Daily impressions
        </span>
      </figcaption>

      <div className="mt-6 flex gap-3">
        {/* Y axis */}
        <div
          aria-hidden
          className="flex h-44 shrink-0 flex-col justify-between text-right text-[10px] tabular-nums text-faint"
        >
          {ticks.map((tick) => (
            <span key={tick}>{formatCompactNumber(tick)}</span>
          ))}
        </div>

        {/* Plot area */}
        <div className="min-w-0 flex-1">
          <div className="relative h-44">
            {/* Gridlines */}
            {ticks.map((tick, index) => (
              <div
                key={tick}
                aria-hidden
                className="absolute inset-x-0 border-t border-line"
                style={{ top: `${(index / (ticks.length - 1)) * 100}%` }}
              />
            ))}

            <div className="absolute inset-0 flex items-end gap-[3px] sm:gap-1.5">
              {days.map((day, index) => {
                const height = (day.impressions / ceiling) * 100;
                return (
                  <div
                    key={day.date.toISOString()}
                    className="group relative flex h-full flex-1 items-end"
                  >
                    <div
                      className="bmp-bar w-full rounded-t-[3px] bg-accent transition-opacity hover:opacity-80"
                      style={{
                        height: `${Math.max(height, 0.6)}%`,
                        animationDelay: `${index * 28}ms`,
                      }}
                    />
                    {/* Hover detail; CSS-only so the chart stays server-rendered. */}
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-2 py-1 text-[11px] font-medium tabular-nums opacity-0 shadow-[var(--shadow-pop)] transition-opacity group-hover:opacity-100">
                      {DAY_LABEL.format(day.date)} ·{" "}
                      {formatNumber(day.impressions)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X axis: label every other day so nothing collides on mobile. */}
          <div
            aria-hidden
            className="mt-2 flex gap-[3px] text-[10px] text-faint sm:gap-1.5"
          >
            {days.map((day, index) => (
              <span
                key={day.date.toISOString()}
                className="min-w-0 flex-1 truncate text-center"
              >
                {index % 2 === 0 ? DAY_LABEL.format(day.date) : "\u00A0"}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Accessible equivalent of the chart. */}
      <table className="sr-only">
        <caption>Impressions per day for the last {days.length} days</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Impressions</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date.toISOString()}>
              <th scope="row">{DAY_LABEL.format(day.date)}</th>
              <td>{formatNumber(day.impressions)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
