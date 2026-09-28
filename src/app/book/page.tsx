import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge, Section } from "@/components/ui";
import { BookingForm } from "@/components/book/booking-form";
import { getPrimaryCreator } from "@/server/creators";
import { availabilityForTerm, earliestStartDate } from "@/server/availability";
import { toDateInputValue } from "@/lib/dates";
import { isPaymentsConfigured } from "@/lib/env";
import { LAUNCH_SPECIAL } from "@/lib/pricing";
import type { BookablePlacement } from "@/components/book/types";

export const metadata: Metadata = {
  title: "Book a placement",
  description:
    "Reserve a product link in the bio or half of the cover photo. Pick your " +
    "placements and term, see the price instantly, and pay securely.",
};

export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ slots?: string; promo?: string; term?: string }>;
}) {
  const [creator, params] = await Promise.all([
    getPrimaryCreator(),
    searchParams,
  ]);
  if (!creator) notFound();

  const minStart = earliestStartDate();
  const availability = await availabilityForTerm(creator.id, minStart, 1);

  const placements: BookablePlacement[] = creator.placements.map(
    (placement) => ({
      slotKey: placement.slotKey,
      kind: placement.kind,
      label: placement.label,
      summary: placement.summary,
      details: placement.details,
      priceMonthlyCents: placement.priceMonthlyCents,
      minMonths: placement.minMonths,
      maxMonths: placement.maxMonths,
      available: availability[placement.slotKey]?.available ?? true,
      openCount: availability[placement.slotKey]
        ? Math.max(
            0,
            availability[placement.slotKey].maxConcurrent -
              availability[placement.slotKey].overlapping,
          )
        : placement.maxConcurrent,
      maxConcurrent: placement.maxConcurrent,
      nextAvailableFrom:
        availability[placement.slotKey]?.nextAvailableFrom?.toISOString() ??
        null,
    }),
  );

  // `?slots=bio-link,cover-left` deep-links a pre-filled selection from the
  // landing page cards; `?promo=1` pre-ticks the promo-post add-on.
  const initialSlots = (params.slots ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const initialPromoPost = params.promo === "1" || params.promo === "true";
  // `?term=launch` pre-selects the two-week launch special (bio link only).
  const initialMonths =
    params.term === "launch" && LAUNCH_SPECIAL.active
      ? LAUNCH_SPECIAL.months
      : 1;

  return (
    <>
      <div className="border-b border-line">
        <Section className="py-14">
          <Badge tone="accent">
            Booking with {creator.displayName} · {creator.handle}
          </Badge>
          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            Book your placement.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            Pick what you want and for how long. The price updates as you go.
            Discounts are applied automatically, so there is nothing to
            negotiate.
          </p>
        </Section>
      </div>

      <Section className="py-12">
        <BookingForm
          creatorSlug={creator.slug}
          placements={placements}
          promoPostPriceCents={creator.promoPostPriceCents}
          initialSlots={initialSlots}
          initialPromoPost={initialPromoPost}
          initialMonths={initialMonths}
          minStartDate={toDateInputValue(minStart)}
          paymentsConfigured={isPaymentsConfigured()}
        />
      </Section>
    </>
  );
}
