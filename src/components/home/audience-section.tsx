import Link from "next/link";

import { Section, SectionHeading, ShareBar } from "@/components/ui";
import { formatBps, formatCompactNumber, formatRatio } from "@/lib/format";
import type { SnapshotView } from "@/components/home/types";

export interface AudienceSegmentView {
  id: string;
  category: string;
  label: string;
  shareBps: number;
}

const CATEGORIES: { key: string; title: string; note: string }[] = [
  { key: "age", title: "Age", note: "Share of engaged audience" },
  { key: "gender", title: "Gender", note: "Inferred by X" },
  { key: "country", title: "Top countries", note: "Share of engagement" },
];

/**
 * Who you reach: age, gender and country bars from the published audience
 * segments, plus two quality ratios from the 90-day snapshot. Only the
 * categories X Analytics actually reports are shown.
 */
export function AudienceSection({
  segments,
  snapshot,
}: {
  segments: AudienceSegmentView[];
  snapshot?: SnapshotView;
}) {
  const groups = CATEGORIES.map((category) => ({
    ...category,
    items: segments.filter((segment) => segment.category === category.key),
  })).filter((group) => group.items.length > 0);

  if (groups.length === 0 && !snapshot) return null;

  // Headline in the section title comes from the data, not from copy.
  const age = groups.find((group) => group.key === "age")?.items ?? [];
  const coreAgeBps = age
    .filter((item) => item.label === "18–24" || item.label === "25–34")
    .reduce((sum, item) => sum + item.shareBps, 0);

  const verifiedShare =
    snapshot && snapshot.followers
      ? snapshot.verifiedFollowers / snapshot.followers
      : 0;

  return (
    <div className="border-y border-line bg-panel">
      <Section className="py-16 sm:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            align="left"
            eyebrow="Audience"
            title={
              coreAgeBps > 0
                ? `${formatBps(coreAgeBps)} are aged 18–34.`
                : "Who you reach."
            }
            description="A tech and AI audience of builders and early adopters. Breakdown as reported by X Analytics."
          />
          <Link
            href="/analytics#audience"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-foreground"
          >
            Full audience data
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-0.5"
            >
              &rarr;
            </span>
          </Link>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {groups.map((group) => (
            <section
              key={group.key}
              className="rounded-2xl border border-line bg-surface p-5 sm:p-6"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-base font-bold">{group.title}</h3>
                <p className="text-xs text-faint">{group.note}</p>
              </div>
              <div className="mt-5 space-y-3.5">
                {group.items.map((segment) => (
                  <ShareBar
                    key={segment.id}
                    label={segment.label}
                    share={segment.shareBps / 10_000}
                    value={formatBps(segment.shareBps)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {snapshot ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <QualityStat
              label="Verified followers"
              value={formatRatio(verifiedShare, 1)}
              note={`${formatCompactNumber(snapshot.verifiedFollowers)} of ${formatCompactNumber(snapshot.followers)} pay for X Premium`}
            />
            <QualityStat
              label="Replies · 90 days"
              value={formatCompactNumber(snapshot.replies)}
              note="Conversation, not just passive likes"
            />
            <QualityStat
              label="Followers gained · 90 days"
              value={`+${formatCompactNumber(snapshot.followersGained)}`}
              note="Net new in the window"
            />
          </dl>
        ) : null}
      </Section>
    </div>
  );
}

function QualityStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-5 py-4">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums">
        {value}
      </dd>
      <p className="mt-1 text-xs text-faint">{note}</p>
    </div>
  );
}
