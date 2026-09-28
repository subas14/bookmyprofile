"use client";

import { Badge, Card, cx } from "@/components/ui";
import { formatDate, formatMoney } from "@/lib/format";
import type { BookablePlacement } from "@/components/book/types";

/**
 * Step 1 of the booking flow: choose which placements to reserve.
 *
 * Unavailable placements are rendered disabled with the date they free up,
 * rather than hidden, so the advertiser can see the full inventory.
 */
export function SlotPicker({
  placements,
  selected,
  onToggle,
}: {
  placements: BookablePlacement[];
  selected: string[];
  onToggle: (slotKey: string) => void;
}) {
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold">1. Choose your placements</h2>
        <span className="text-xs text-muted">
          {selected.length} selected
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Select one or more. Booking several at once unlocks a bundle discount.
      </p>

      <fieldset className="mt-5 space-y-3">
        <legend className="sr-only">Available placements</legend>
        {placements.map((placement) => {
          const isSelected = selected.includes(placement.slotKey);
          const disabled = !placement.available;

          return (
            <label
              key={placement.slotKey}
              className={cx(
                "flex cursor-pointer items-start gap-3.5 rounded-xl p-4 ring-1",
                disabled
                  ? "cursor-not-allowed bg-panel/50 ring-line opacity-55 transition-colors"
                  : isSelected
                    ? "bmp-option bg-accent/10 ring-accent/40 hover:bg-accent/15 hover:ring-accent"
                    : "bmp-option bg-panel ring-line hover:bg-subtle hover:ring-line-strong",
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={disabled}
                onChange={() => onToggle(placement.slotKey)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{placement.label}</span>
                  {placement.kind === "BIO_LINK" ? (
                    <Badge tone="accent">Highest intent</Badge>
                  ) : null}
                  {!disabled &&
                  placement.maxConcurrent &&
                  placement.maxConcurrent > 1 &&
                  placement.openCount !== undefined ? (
                    <Badge tone="success">
                      {placement.openCount} of {placement.maxConcurrent} open
                    </Badge>
                  ) : null}
                  {disabled ? <Badge tone="danger">Booked</Badge> : null}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  {placement.summary}
                </span>
                {disabled && placement.nextAvailableFrom ? (
                  <span className="mt-1.5 block text-xs text-warning">
                    Next available from{" "}
                    {formatDate(placement.nextAvailableFrom)}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-sm font-semibold tabular-nums">
                  {formatMoney(placement.priceMonthlyCents)}
                </span>
                <span className="block text-xs text-muted">/month</span>
              </span>
            </label>
          );
        })}
      </fieldset>
    </Card>
  );
}
