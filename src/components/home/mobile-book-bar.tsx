import { ButtonArrow, ButtonLink } from "@/components/ui";
import { formatMoney } from "@/lib/format";

/**
 * Sticky booking bar for phones. Pure CSS (`position: sticky` at the bottom
 * of the page flow), so it needs no client JS and disappears above `sm`.
 */
export function MobileBookBar({
  openCount,
  fromCents,
}: {
  openCount: number;
  fromCents: number;
}) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-line bg-background/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-sm">
          <p className="font-semibold tabular-nums">
            From {formatMoney(fromCents)}/mo
          </p>
          <p className="truncate text-xs text-muted">
            {openCount === 0
              ? "All placements booked"
              : `${openCount} placement${openCount === 1 ? "" : "s"} open`}
          </p>
        </div>
        <ButtonLink href="/book" size="md">
          Book
          <ButtonArrow />
        </ButtonLink>
      </div>
    </div>
  );
}
