import { Card } from "@/components/ui";
import { StatusPill } from "@/components/status-pill";
import {
  formatDate,
  formatDateRange,
  formatMoney,
  formatNumber,
  formatTerm,
} from "@/lib/format";
import type { LookupResult } from "@/components/campaigns/types";

/** Renders a located order: one panel per booked placement, plus its history. */
export function CampaignResults({ result }: { result: LookupResult }) {
  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">
              Reference
            </p>
            <p className="mt-1 font-mono text-lg font-semibold">
              {result.reference}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs uppercase tracking-wider text-muted">
              Order total
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatMoney(result.totalAmountCents)}
            </p>
          </div>
        </div>
        <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
          Running on{" "}
          <a
            href={result.creator.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent transition-colors hover:text-foreground"
          >
            {result.creator.handle}
          </a>
        </p>
      </Card>

      {result.campaigns.map((campaign) => {
        const totals = campaign.metrics.reduce(
          (acc, metric) => ({
            impressions: acc.impressions + metric.impressions,
            clicks: acc.clicks + metric.clicks,
            profileVisits: acc.profileVisits + metric.profileVisits,
          }),
          { impressions: 0, clicks: 0, profileVisits: 0 },
        );

        return (
          <Card key={campaign.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">
                  {campaign.placement.label}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {formatDateRange(campaign.startDate, campaign.endDate)} ·{" "}
                  {formatTerm(campaign.months)}
                </p>
              </div>
              <StatusPill status={campaign.status} />
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-5">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">
                  Impressions
                </dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">
                  {formatNumber(totals.impressions)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">
                  Clicks
                </dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">
                  {formatNumber(totals.clicks)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted">
                  Profile visits
                </dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums">
                  {formatNumber(totals.profileVisits)}
                </dd>
              </div>
            </dl>

            {campaign.metrics.length === 0 ? (
              <p className="mt-4 text-xs text-muted">
                Performance data appears here once the placement is live.
              </p>
            ) : null}

            <div className="mt-6 border-t border-line pt-5">
              <p className="text-sm font-medium">History</p>
              <ol className="mt-3 space-y-2.5">
                {campaign.events.map((event, index) => (
                  <li key={`${event.type}-${index}`} className="flex gap-3 text-sm">
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    />
                    <span className="min-w-0">
                      <span className="block">{event.message}</span>
                      <span className="text-xs text-muted">
                        {formatDate(event.createdAt)}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        );
      })}
    </>
  );
}
