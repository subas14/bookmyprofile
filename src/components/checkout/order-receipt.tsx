import { Badge, Card } from "@/components/ui";
import { StatusPill } from "@/components/status-pill";
import { formatDateRange, formatMoney, formatTerm } from "@/lib/format";

/** Order summary shown after checkout and on the campaign page. */
export function OrderReceipt({
  reference,
  status,
  brandName,
  placementLabels,
  months,
  startDate,
  endDate,
  includesPromoPost,
  totalCents,
  isPaid,
}: {
  reference: string;
  status: string;
  brandName: string;
  placementLabels: string[];
  months: number;
  startDate: Date;
  endDate: Date;
  includesPromoPost: boolean;
  totalCents: number;
  isPaid: boolean;
}) {
  return (
    <Card className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            Booking reference
          </p>
          <p className="mt-1 font-mono text-xl font-bold">
            {reference}
          </p>
        </div>
        <StatusPill status={status} />
      </div>

      <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Brand</dt>
          <dd>{brandName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Placements</dt>
          <dd className="text-right">{placementLabels.join(", ")}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Term</dt>
          <dd className="text-right">
            {formatTerm(months)} ·{" "}
            {formatDateRange(startDate, endDate)}
          </dd>
        </div>
        {includesPromoPost ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Add-on</dt>
            <dd>
              <Badge tone="accent">Dedicated promo post</Badge>
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-3 border-t border-line pt-3 text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatMoney(totalCents)}</dd>
        </div>
      </dl>

      <div className="mt-6 rounded-xl bg-panel p-4 ring-1 ring-line">
        <p className="text-sm font-medium">What happens next</p>
        <ol className="mt-2.5 space-y-1.5 text-sm text-muted">
          <li>1. {isPaid ? "Payment confirmed." : "Payment is confirmed."}</li>
          <li>2. I review the booking and your creative.</li>
          <li>
            3. The placement goes live on your start date and you receive an
            email.
          </li>
        </ol>
      </div>
    </Card>
  );
}
