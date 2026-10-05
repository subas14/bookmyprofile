import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge, Section } from "@/components/ui";
import { BookingForm } from "@/components/book/booking-form";
import { CreatorAvatar } from "@/components/creator-avatar";
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
      <div className="border-b border-line bg-panel">
        <Section className="py-10 sm:py-12">
          <div className="flex flex-wrap items-center gap-3">
            <CreatorAvatar
              src={creator.avatarUrl}
              name={creator.displayName}
              size={36}
            />
            <Badge tone="accent">
              Booking with {creator.displayName} · {creator.handle}
            </Badge>
          </div>
          <h1 className="mt-5 text-balance text-3xl font-extrabold tracking-[-0.03em] sm:text-[2.75rem]">
            Book your placement.
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Pick what you want and for how long. The price updates as you go,
            and discounts apply automatically.
          </p>
          <ol className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            {["Placements", "Term", "Details", "Secure checkout"].map(
              (label, index) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line-strong font-mono text-[11px] font-semibold">
                    {index + 1}
                  </span>
                  {label}
                </li>
              ),
            )}
          </ol>
        </Section>
      </div>

      <Section className="py-10 sm:py-12">
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
