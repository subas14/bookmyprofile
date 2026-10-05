import { notFound } from "next/navigation";

import { HeroSection } from "@/components/home/hero-section";
import { InventorySection } from "@/components/home/inventory-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { TransparencySection } from "@/components/home/transparency-section";
import { AudienceSection } from "@/components/home/audience-section";
import { MobileBookBar } from "@/components/home/mobile-book-bar";
import { DiscountsSection } from "@/components/home/discounts-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { FinalCtaSection } from "@/components/home/final-cta-section";
import {
  BILLING_WINDOW_DAYS,
  getPrimaryCreator,
  groupPlacements,
  monthlyImpressions,
  snapshotFor,
} from "@/server/creators";
import { availabilityForTerm } from "@/server/availability";
import { todayUtc } from "@/lib/dates";
import { costPerMille } from "@/lib/format";

/**
 * Landing page.
 *
 * Availability reflects live inventory, so the page is rendered per request
 * rather than statically cached, so a slot is never be advertised as open when
 * it has just been booked.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const creator = await getPrimaryCreator();
  if (!creator) notFound();

  // The 90-day window is the basis for every "per month" and CPM claim so a
  // single viral post cannot inflate it. Detailed analytics live on /analytics.
  const billing = snapshotFor(creator.analyticsSnapshots, BILLING_WINDOW_DAYS);
  const perMonth = monthlyImpressions(billing);
  const availability = await availabilityForTerm(creator.id, todayUtc(), 1);

  const grouped = groupPlacements(creator.placements);
  const coverSlots = grouped.COVER_SLOT;
  const bioLink = grouped.BIO_LINK[0];

  const openCoverSlots = coverSlots.filter(
    (slot) => availability[slot.slotKey]?.available,
  ).length;
  const bioAvailability = bioLink ? availability[bioLink.slotKey] : undefined;
  const bioAvailable = bioAvailability?.available ?? false;
  // The bio holds several product links at once, so count open lines rather
  // than treating it as a single yes/no slot.
  const bioLinksOpen = bioAvailability
    ? Math.max(0, bioAvailability.maxConcurrent - bioAvailability.overlapping)
    : 0;
  const openCount = openCoverSlots + bioLinksOpen;
  const bioLinksTaken = bioAvailability?.overlapping ?? 0;

  // Slots fully booked right now, drawn as taken in the hero profile mock.
  const takenSlots = creator.placements
    .filter((placement) => availability[placement.slotKey]?.available === false)
    .map((placement) => placement.slotKey);

  // Printed directly on each cover half in the hero mock.
  const coverPrices = Object.fromEntries(
    coverSlots.map((slot) => [slot.slotKey, slot.priceMonthlyCents]),
  );

  // Effective CPM of the cheapest slot against a normalised month: the
  // clearest value argument we can give an advertiser.
  const sellable = creator.placements.filter((p) => p.kind !== "PROMO_POST");
  const cheapestSlotCents = Math.min(
    ...sellable.map((placement) => placement.priceMonthlyCents),
  );
  const cpm = costPerMille(cheapestSlotCents, perMonth);

  // "Verified analytics" is only claimed when both the creator and the
  // published 90-day snapshot are marked verified in the database.
  const analyticsVerified = Boolean(creator.isVerified && billing?.isVerified);

  return (
    <>
      <HeroSection
        displayName={creator.displayName}
        handle={creator.handle}
        headline={creator.headline}
        avatarUrl={creator.avatarUrl}
        profileUrl={creator.profileUrl}
        followerCount={creator.followerCount}
        billing={billing}
        monthlyImpressions={perMonth}
        openCount={openCount}
        cheapestSlotCents={cheapestSlotCents}
        cpm={cpm}
        takenSlots={takenSlots}
        bioLinksTaken={bioLinksTaken}
        coverPrices={coverPrices}
        bioLinkPriceCents={bioLink?.priceMonthlyCents}
      />

      <InventorySection
        coverSlots={coverSlots}
        bioLink={bioLink}
        profileUrl={creator.profileUrl}
        handle={creator.handle}
        availability={availability}
        bioAvailable={bioAvailable}
        bioLinksOpen={bioLinksOpen}
      />

      <HowItWorksSection />

      <TransparencySection
        snapshotSource={billing?.source}
        snapshotEnd={billing?.periodEnd}
        isVerified={analyticsVerified}
      />

      <AudienceSection segments={creator.audienceSegments} snapshot={billing} />

      <DiscountsSection />

      <TestimonialsSection testimonials={creator.testimonials} />

      <FinalCtaSection monthlyImpressions={perMonth} openCount={openCount} />

      <MobileBookBar openCount={openCount} fromCents={cheapestSlotCents} />
    </>
  );
}
