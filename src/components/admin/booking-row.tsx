import { Card } from "@/components/ui";
import { StatusPill } from "@/components/status-pill";
import { BookingActions } from "@/components/admin/booking-actions";
import { formatDateRange, formatMoney, formatTerm } from "@/lib/format";

/** One booking in the creator console, with its moderation controls. */
export function AdminBookingRow({
  id,
  reference,
  status,
  brandName,
  placementLabel,
  advertiserEmail,
  targetUrl,
  notes,
  months,
  startDate,
  endDate,
  totalAmountCents,
}: {
  id: string;
  reference: string;
  status: string;
  brandName: string;
  placementLabel: string;
  advertiserEmail: string;
  targetUrl: string;
  notes: string | null;
  months: number;
  startDate: Date;
  endDate: Date;
  totalAmountCents: number;
}) {
  return (
    <Card className="bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-sm font-semibold">{reference}</span>
            <StatusPill status={status} />
          </div>

          <p className="mt-2 text-sm">
            <strong className="font-semibold">{brandName}</strong>{" "}
            <span className="text-muted">· {placementLabel}</span>
          </p>

          <p className="mt-1 text-xs text-muted">
            {formatDateRange(startDate, endDate)} · {formatTerm(months)} ·{" "}
            {advertiserEmail}
          </p>

          <p className="mt-1 truncate text-xs text-muted">
            &rarr;{" "}
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-accent transition-colors hover:text-foreground"
            >
              {targetUrl}
            </a>
          </p>

          {notes ? (
            <p className="mt-2 rounded-lg bg-panel px-3 py-2 text-xs leading-relaxed text-muted ring-1 ring-line">
              {notes}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 space-y-3 sm:text-right">
          <p className="text-lg font-semibold tabular-nums">
            {formatMoney(totalAmountCents)}
          </p>
          <BookingActions bookingId={id} status={status} />
        </div>
      </div>
    </Card>
  );
}
