import { cx } from "@/components/ui";

/**
 * Miniature, to-scale previews of where each placement appears on the X
 * profile. Decorative only (aria-hidden); the card text carries the meaning.
 */

/** Cover photo split down the middle, with one half (or neither) emphasised. */
export function CoverVisual({
  side,
  open,
}: {
  side: "left" | "right";
  open: boolean;
}) {
  return (
    <div
      aria-hidden
      className="relative overflow-hidden rounded-lg border border-line bg-subtle"
    >
      <div className="relative grid h-16 grid-cols-2 gap-1 p-1.5">
        {(["left", "right"] as const).map((half) => {
          const mine = half === side;
          return (
            <div
              key={half}
              className={cx(
                "flex items-center justify-center rounded-md text-[10px] font-semibold uppercase tracking-wider",
                mine
                  ? open
                    ? "border-2 border-dashed border-accent bg-accent-wash text-accent"
                    : "border border-line-strong bg-subtle-strong text-faint"
                  : "bg-surface/60 text-faint/60",
              )}
            >
              {mine ? (open ? "Your brand" : "Booked") : null}
            </div>
          );
        })}
      </div>
      {/* Avatar + name lines, as on X */}
      <div className="relative h-9 bg-surface px-3">
        <span className="absolute -top-3 left-3 h-7 w-7 rounded-full border-2 border-surface bg-subtle-strong" />
        <span className="absolute left-12 top-2 h-1.5 w-14 rounded-full bg-subtle-strong" />
        <span className="absolute left-12 top-5 h-1.5 w-9 rounded-full bg-subtle" />
      </div>
    </div>
  );
}

/** Three bio lines, with taken lines greyed and the next free line marked. */
export function BioVisual({ max, open }: { max: number; open: number }) {
  const taken = Math.max(0, max - open);
  return (
    <div
      aria-hidden
      className="space-y-1.5 rounded-lg border border-line bg-subtle p-2.5"
    >
      <span className="block h-1.5 w-3/4 rounded-full bg-subtle-strong" />
      {Array.from({ length: max }, (_, index) => {
        const isTaken = index < taken;
        const isNext = index === taken;
        return (
          <div
            key={index}
            className={cx(
              "flex h-5 items-center gap-1.5 rounded-md px-2 text-[10px] font-medium",
              isTaken
                ? "bg-subtle-strong text-faint"
                : isNext
                  ? "border border-dashed border-accent bg-accent-wash text-accent"
                  : "border border-dashed border-line-strong text-faint",
            )}
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            {isTaken ? "Booked" : isNext ? "yourproduct.com" : "Open"}
          </div>
        );
      })}
    </div>
  );
}

/** A post card, pinned. */
export function PostVisual({
  pinnedLabel = "Pinned 7d",
}: {
  pinnedLabel?: string;
}) {
  return (
    <div
      aria-hidden
      className="rounded-lg border border-line bg-subtle p-2.5"
    >
      <div className="flex items-center gap-2">
        <span className="h-5 w-5 rounded-full bg-subtle-strong" />
        <span className="h-1.5 w-12 rounded-full bg-subtle-strong" />
        <span className="ml-auto rounded bg-accent-wash px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
          {pinnedLabel}
        </span>
      </div>
      <span className="mt-2 block h-1.5 w-full rounded-full bg-subtle-strong" />
      <span className="mt-1 block h-1.5 w-4/5 rounded-full bg-subtle-strong" />
      <div className="mt-2 flex h-5 items-center rounded-md border border-dashed border-accent bg-accent-wash px-2 text-[10px] font-medium text-accent">
        Your product, in my voice
      </div>
    </div>
  );
}
