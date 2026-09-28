import { Section, SectionHeading } from "@/components/ui";
import { costPerMille, formatCompactNumber, formatMoney } from "@/lib/format";

/**
 * Effective CPM per placement.
 *
 * This is the single most useful number for an advertiser comparing this
 * inventory against paid social, so it is published rather than buried.
 */
export function CpmTable({
  placements,
  monthlyImpressions,
  basisPeriodDays,
}: {
  placements: { id: string; label: string; priceMonthlyCents: number }[];
  /** Impressions normalised to a 30-day month. */
  monthlyImpressions: number;
  /** The window the monthly figure was derived from, for the disclosure note. */
  basisPeriodDays: number;
}) {
  return (
    <div className="border-y border-line bg-panel">
      <Section className="py-12 sm:py-14">
        <SectionHeading
          align="left"
          eyebrow="Value"
          title="What that costs you"
          description={`Effective CPM for each placement against a 30-day month, derived from the ${basisPeriodDays}-day window rather than the best week. For comparison, X Ads rarely clears $5 CPM.`}
        />

        <div className="mt-10 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="border-b border-line text-xs font-semibold text-muted">
              <tr>
                <th scope="col" className="px-5 py-3.5 font-medium">
                  Placement
                </th>
                <th scope="col" className="px-5 py-3.5 text-right font-medium">
                  Per month
                </th>
                <th scope="col" className="px-5 py-3.5 text-right font-medium">
                  Impressions / mo
                </th>
                <th scope="col" className="px-5 py-3.5 text-right font-medium">
                  Effective CPM
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface">
              {placements.map((placement) => (
                <tr key={placement.id}>
                  <td className="px-5 py-4 font-medium">{placement.label}</td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {formatMoney(placement.priceMonthlyCents)}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums text-muted">
                    {formatCompactNumber(monthlyImpressions)}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold tabular-nums text-accent">
                    $
                    {costPerMille(
                      placement.priceMonthlyCents,
                      monthlyImpressions,
                    ).toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted">
          CPM assumes your placement is seen alongside the profile&rsquo;s total
          impressions for the period. Cover and bio placements are persistent, so
          they accumulate exposure on every day of your term rather than only
          while a single post is circulating.
        </p>
      </Section>
    </div>
  );
}
