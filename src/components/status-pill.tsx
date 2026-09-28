import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_STYLES,
  isBookingStatus,
} from "@/lib/domain";
import { cx } from "@/components/ui";

/** Renders a booking status as a coloured pill. */
export function StatusPill({ status }: { status: string }) {
  const valid = isBookingStatus(status);
  const label = valid ? BOOKING_STATUS_LABELS[status] : status;
  const style = valid
    ? BOOKING_STATUS_STYLES[status]
    : "border-line bg-subtle text-muted";

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        style,
      )}
    >
      {status === "LIVE" ? (
        <span
          aria-hidden
          className="bmp-live-dot h-1.5 w-1.5 rounded-full bg-success"
        />
      ) : null}
      {label}
    </span>
  );
}
