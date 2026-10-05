import type { ReactNode } from "react";

import {
  Badge,
  ButtonArrow,
  ButtonLink,
  Section,
  SectionHeading,
  cx,
} from "@/components/ui";
import { BioVisual, CoverVisual } from "@/components/home/placement-visuals";
import { PromoOffers } from "@/components/promo-offers";
import { BIO_LINK_MAX_CONCURRENT } from "@/lib/domain";
import { formatDate, formatMoney } from "@/lib/format";
import { LAUNCH_SPECIAL } from "@/lib/pricing";
import type {
  AvailabilityView,
  PlacementView,
} from "@/components/home/types";

/**
 * "Choose your placement": one card per sellable placement, each with a
 * to-scale preview, the live price and availability from the database, and a
 * deep link into the booking flow (`/book?slots=…`). The launch special sits
 * above as a slim banner; the dedicated-post offers (booked by DM) sit below.
 *
 * The section keeps `id="inventory"` so existing `/#inventory` links resolve.
 */
export function InventorySection({
  coverSlots,
  bioLink,
  availability,
  bioAvailable,
  bioLinksOpen,
  profileUrl,
  handle,
}: {
  coverSlots: PlacementView[];
  bioLink?: PlacementView;
  /** Creator's X profile; the post offers are booked by DM there. */
  profileUrl: string;
  handle: string;
  availability: Record<string, AvailabilityView>;
  /** Server availability verdict for the bio link (authoritative). */
  bioAvailable: boolean;
  /** Free product-link lines in the bio. */
  bioLinksOpen: number;
}) {
  const bioMax = bioLink
    ? (availability[bioLink.slotKey]?.maxConcurrent ?? BIO_LINK_MAX_CONCURRENT)
    : BIO_LINK_MAX_CONCURRENT;

  return (
    <div className="border-y border-line bg-panel">
      <Section id="inventory" className="py-16 sm:py-20">
        <SectionHeading
          align="left"
          eyebrow="Placements"
          title="Choose your placement."
          description="Published monthly prices, live availability. Longer terms and bundles are discounted automatically at checkout."
        />

        {bioLink && LAUNCH_SPECIAL.active ? (
          <div className="mt-8 flex flex-col gap-3 rounded-xl border border-dashed border-accent/60 bg-accent-wash px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              <span className="mr-2 rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-fg">
                Launch special
              </span>
              <strong className="font-semibold">
                Product link in bio for 2 weeks,{" "}
                <span className="tabular-nums">
                  {formatMoney(LAUNCH_SPECIAL.priceCents)}
                </span>
              </strong>
              <span className="text-muted"> · test the audience first.</span>
            </p>
            <ButtonLink
              href={`/book?slots=${bioLink.slotKey}&term=launch`}
              size="sm"
              className="self-start sm:self-auto"
            >
              Claim it
              <ButtonArrow />
            </ButtonLink>
          </div>
        ) : null}

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bioLink ? (
            <PlacementCard
              title={bioLink.label}
              tag="Highest intent"
              summary={bioLink.summary}
              priceCents={bioLink.priceMonthlyCents}
              unit="/month"
              status={
                bioAvailable
                  ? { tone: "success", label: `${bioLinksOpen} of ${bioMax} open` }
                  : {
                      tone: "danger",
                      label: "All booked",
                      next: availability[bioLink.slotKey]?.nextAvailableFrom,
                    }
              }
              href={`/book?slots=${bioLink.slotKey}`}
              cta={bioAvailable ? "Book" : "See dates"}
              visual={
                <BioVisual max={bioMax} open={bioAvailable ? bioLinksOpen : 0} />
              }
              featured
            />
          ) : null}

          {coverSlots.map((slot, index) => {
            const info = availability[slot.slotKey];
            const open = info?.available ?? false;
            return (
              <PlacementCard
                key={slot.id}
                title={slot.label}
                summary={slot.summary}
                priceCents={slot.priceMonthlyCents}
                unit="/month"
                status={
                  open
                    ? { tone: "success", label: "Open" }
                    : {
                        tone: "danger",
                        label: "Booked",
                        next: info?.nextAvailableFrom,
                      }
                }
                href={`/book?slots=${slot.slotKey}`}
                cta={open ? "Book" : "See dates"}
                visual={
                  <CoverVisual side={index === 0 ? "left" : "right"} open={open} />
                }
              />
            );
          })}

        </ul>

        {/* Dedicated-post offers, booked by DM (display only). */}
        <PromoOffers
          profileUrl={profileUrl}
          handle={handle}
          className="mt-12 border-t border-line pt-10"
        />
      </Section>
    </div>
  );
}

type StatusTone = "success" | "danger" | "neutral";

function PlacementCard({
  title,
  tag,
  summary,
  priceCents,
  unit,
  status,
  href,
  cta,
  visual,
  featured,
}: {
  title: string;
  tag?: string;
  summary: string;
  priceCents: number;
  unit: string;
  status: { tone: StatusTone; label: string; next?: Date | null };
  href: string;
  cta: string;
  visual: ReactNode;
  featured?: boolean;
}) {
  return (
    <li
      className={cx(
        "bmp-lift flex flex-col rounded-2xl border bg-surface p-5",
        featured ? "border-accent/50" : "border-line",
      )}
    >
      {visual}

      <div className="mt-5 flex items-start justify-between gap-2">
        <h3 className="text-base font-bold leading-snug tracking-tight">
          {title}
        </h3>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      {tag ? (
        <p className="mt-1 text-xs font-semibold text-accent">{tag}</p>
      ) : null}
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{summary}</p>
      {status.next ? (
        <p className="mt-2 text-xs text-warning">
          Next available {formatDate(status.next)}
        </p>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="tabular-nums">
          <span className="text-xl font-bold tracking-tight">
            {formatMoney(priceCents)}
          </span>
          <span className="ml-0.5 text-xs text-muted">{unit}</span>
        </p>
        <ButtonLink
          href={href}
          size="sm"
          variant={featured ? "primary" : "secondary"}
        >
          {cta}
          <ButtonArrow />
        </ButtonLink>
      </div>
    </li>
  );
}

