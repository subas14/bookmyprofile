import type { Metadata } from "next";

import { EmptyState, Section, StatCard } from "@/components/ui";
import { AdminLogin } from "@/components/admin/admin-login";
import { AdminBookingRow } from "@/components/admin/booking-row";
import { isAdminConfigured, isAdminRequest } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STATUSES } from "@/lib/domain";
import { formatMoney, formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Creator console",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Creator console.
 *
 * Shows the review queue and revenue at a glance, and exposes the moderation
 * actions that move a booking through its lifecycle.
 */
export default async function AdminPage() {
  const authorised = await isAdminRequest();

  if (!authorised) {
    return (
      <Section className="py-20">
        <div className="mx-auto max-w-md">
          <h1 className="text-center text-3xl font-bold tracking-tight">
            Creator console
          </h1>
          <p className="mt-3 text-center text-sm text-muted">
            This area is restricted.
          </p>
          <div className="mt-8">
            <AdminLogin configured={isAdminConfigured()} />
          </div>
        </div>
      </Section>
    );
  }

  const [bookings, paidAggregate, activeCount] = await Promise.all([
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        placement: { select: { label: true, slotKey: true } },
      },
    }),
    prisma.booking.aggregate({
      where: { paidAt: { not: null } },
      _sum: { totalAmountCents: true },
    }),
    prisma.booking.count({ where: { status: { in: [...ACTIVE_STATUSES] } } }),
  ]);

  const awaitingReview = bookings.filter(
    (booking) => booking.status === "AWAITING_REVIEW",
  );
  const revenueCents = paidAggregate._sum.totalAmountCents ?? 0;

  return (
    <Section className="py-14">
      <div className="flex flex-col gap-2 border-b border-line pb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">
          Admin
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Creator console
        </h1>
        <p className="text-sm text-muted">
          Review bookings and move campaigns through their lifecycle.
        </p>
      </div>

      <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Awaiting review"
          value={formatNumber(awaitingReview.length)}
          hint="Paid, needs a decision"
          emphasis={awaitingReview.length > 0}
        />
        <StatCard
          label="Active campaigns"
          value={formatNumber(activeCount)}
          hint="Scheduled or live"
        />
        <StatCard
          label="Collected revenue"
          value={formatMoney(revenueCents)}
          hint="All settled payments"
        />
        <StatCard
          label="Bookings shown"
          value={formatNumber(bookings.length)}
          hint="Most recent 100"
        />
      </dl>

      <div className="mt-12">
        <h2 className="text-lg font-bold">Bookings</h2>

        {bookings.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No bookings yet"
              description="Bookings appear here as soon as an advertiser starts checkout."
            />
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {bookings.map((booking) => (
              <AdminBookingRow
                key={booking.id}
                id={booking.id}
                reference={booking.reference}
                status={booking.status}
                brandName={booking.brandName}
                placementLabel={booking.placement.label}
                advertiserEmail={booking.advertiserEmail}
                targetUrl={booking.targetUrl}
                notes={booking.notes}
                months={booking.months}
                startDate={booking.startDate}
                endDate={booking.endDate}
                totalAmountCents={booking.totalAmountCents}
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
