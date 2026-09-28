import {
  ButtonLink,
  Section,
  SectionHeading,
  StatCard,
  TrustItem,
} from "@/components/ui";
import { formatCompactNumber, formatNumber, formatRatio } from "@/lib/format";
import type { SnapshotView } from "@/components/home/types";

/**
 * Audience quality + the transparency promises that back the numbers.
 *
 * Figures come from the 90-day window: it is the only one long enough to make
 * per-post averages meaningful.
 */
export function AudienceSection({ snapshot }: { snapshot?: SnapshotView }) {
  return (
    <Section className="py-14 sm:py-16">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Who you reach"
            title="Tech-first, early-adopter, mostly 18–34."
            description="Four in five are aged 18 to 34 and a quarter are in the United States. It is a tech and AI audience that tries new tools rather than a general-interest feed."
          />
          <div className="mt-8 space-y-5">
            <TrustItem title="Published, dated analytics">
              Every figure comes from X Analytics with the exact window it
              covers, including the metrics that fell.
            </TrustItem>
            <TrustItem title="One brand per placement">
              Placements are exclusive for your whole term. Your logo never
              shares a half of the cover, and your bio link never shares a
              line, with a competitor.
            </TrustItem>
            <TrustItem title="Small, engaged, not inflated">
              Under 7,000 followers doing millions of impressions: reach comes
              from posts travelling, not from a bought follower count.
            </TrustItem>
          </div>
          <div className="mt-9">
            <ButtonLink href="/analytics" variant="secondary">
              Full analytics breakdown
            </ButtonLink>
          </div>
        </div>

        {snapshot ? (
          <dl className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Engagements · 90 days"
              value={formatCompactNumber(snapshot.engagements)}
              hint={`${formatRatio(
                snapshot.engagements / snapshot.impressions,
              )} of impressions`}
            />
            <StatCard
              label="Likes · 90 days"
              value={formatCompactNumber(snapshot.likes)}
              hint="The largest engagement component"
            />
            <StatCard
              label="Replies · 90 days"
              value={formatNumber(snapshot.replies)}
              hint="Conversation, not just passive likes"
            />
            <StatCard
              label="Avg. impressions / post"
              value={formatCompactNumber(
                Math.round(snapshot.impressions / Math.max(1, snapshot.posts)),
              )}
              hint={`Across ${formatNumber(snapshot.posts)} posts`}
            />
          </dl>
        ) : null}
      </div>
    </Section>
  );
}
