import { ShareBar } from "@/components/ui";
import { formatBps } from "@/lib/format";

/**
 * Audience composition, grouped by the categories X Analytics actually reports.
 *
 * Categories the platform does not expose (role, seniority, intent) are
 * deliberately absent rather than estimated.
 */

export interface SegmentView {
  id: string;
  category: string;
  label: string;
  shareBps: number;
}

const CATEGORY_META: Record<
  string,
  { title: string; note: string }
> = {
  age: {
    title: "Age",
    note: "Share of engaged audience by age band.",
  },
  gender: {
    title: "Gender",
    note: "Inferred by X; not self-reported.",
  },
  country: {
    title: "Country",
    note: "Top markets by share of engagement.",
  },
};

export function AudienceBreakdown({ segments }: { segments: SegmentView[] }) {
  // Group while preserving the sort order applied by the query.
  const groups = new Map<string, SegmentView[]>();
  for (const segment of segments) {
    const list = groups.get(segment.category) ?? [];
    list.push(segment);
    groups.set(segment.category, list);
  }

  // Render known categories in a fixed order, then anything unexpected.
  const ordered = [
    ...Object.keys(CATEGORY_META).filter((key) => groups.has(key)),
    ...[...groups.keys()].filter((key) => !(key in CATEGORY_META)),
  ];

  if (ordered.length === 0) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {ordered.map((category) => {
        const meta = CATEGORY_META[category];
        const items = groups.get(category) ?? [];
        return (
          <section
            key={category}
            className="rounded-2xl border border-line bg-surface p-5 sm:p-6"
          >
            <h3 className="text-base font-bold">{meta?.title ?? category}</h3>
            <p className="mt-1 text-xs text-muted">
              {meta?.note ?? "Share of audience."}
            </p>
            <div className="mt-5 space-y-3.5">
              {items.map((segment) => (
                <ShareBar
                  key={segment.id}
                  label={segment.label}
                  share={segment.shareBps / 10_000}
                  value={formatBps(segment.shareBps)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
