import Link from "next/link";

import {
  Badge,
  ButtonArrow,
  ButtonLink,
  Card,
  Section,
  SectionHeading,
  cx,
} from "@/components/ui";
import { BIO_LINK_MAX_CONCURRENT } from "@/lib/domain";
import { formatMoney } from "@/lib/format";
import { LAUNCH_SPECIAL } from "@/lib/pricing";
import type {
  AvailabilityView,
  PlacementView,
} from "@/components/home/types";

/**
 * The inventory section: the product links in the bio (lead), the two cover
 * halves, and the promo add-on, each showing real-time availability.
 */
export function InventorySection({
  coverSlots,
  bioLink,
  promoPost,
  availability,
  openCoverSlots,
  bioAvailable,
  bioLinksOpen,
}: {
  coverSlots: PlacementView[];
  bioLink?: PlacementView;
  promoPost?: PlacementView;
  availability: Record<string, AvailabilityView>;
  openCoverSlots: number;
  bioAvailable: boolean;
  /** Free product-link lines in the bio. */
  bioLinksOpen: number;
}) {
  const bioMax = bioLink
    ? (availability[bioLink.slotKey]?.maxConcurrent ?? BIO_LINK_MAX_CONCURRENT)
    : BIO_LINK_MAX_CONCURRENT;

  return (
    <Section id="inventory">
      <SectionHeading
        eyebrow="The inventory"
        title="Three placements. Published prices."
        description={`Either half of the cover photo for ${
          coverSlots[0] ? formatMoney(coverSlots[0].priceMonthlyCents) : "$99"
        } a month, or a product link in the bio for ${
          bioLink ? formatMoney(bioLink.priceMonthlyCents) : "$89"
        }. Longer terms lower the monthly rate. When a slot is taken, it is shown as taken.`}
      />

      {bioLink && LAUNCH_SPECIAL.active ? (
        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-dashed border-accent/60 bg-accent-wash p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-fg">
              Launch special
            </span>
            <p className="mt-2 text-lg font-bold tracking-tight">
              Try a link in bio for two weeks.
            </p>
            <p className="mt-1 text-sm text-muted">
              Your product link in the bio for 14 days, flat. Test the audience
              before you commit to a month or more.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <p className="text-right">
              <span className="block text-3xl font-extrabold tabular-nums">
                {formatMoney(LAUNCH_SPECIAL.priceCents)}
              </span>
              <span className="text-xs text-muted">per 2 weeks</span>
            </p>
            <ButtonLink
              href={`/book?slots=${bioLink.slotKey}&term=launch`}
              size="sm"
            >
              Claim it
              <ButtonArrow />
            </ButtonLink>
          </div>
        </div>
      ) : null}

      <div
        className={cx(
          "grid gap-5 lg:grid-cols-5",
          bioLink && LAUNCH_SPECIAL.active ? "mt-5" : "mt-14",
        )}
      >
        {bioLink ? (
          <Card className="bmp-lift flex flex-col border-invert-line bg-invert text-invert-fg lg:col-span-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-fg">
                  Highest intent
                </span>
                <h3 className="mt-3 text-2xl font-bold tracking-tight">
                  {bioLink.label}
                </h3>
              </div>
              <Badge tone={bioAvailable ? "success" : "danger"}>
                {bioAvailable
                  ? `${bioLinksOpen} of ${bioMax} open`
                  : "All booked"}
              </Badge>
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-invert-fg/70">
              {bioLink.details}
            </p>

            {/* Three bio lines, drawn to scale */}
            <ul className="mt-6 space-y-2">
              {Array.from({ length: bioMax }, (_, index) => {
                const open = index >= bioMax - bioLinksOpen;
                return (
                  <li
                    key={index}
                    className={cx(
                      "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-[13px]",
                      open
                        ? "border-dashed border-accent/70 bg-accent/10 text-invert-fg"
                        : "border-invert-fg/15 bg-invert-fg/5 text-invert-fg/50",
                    )}
                  >
                    <span className="font-medium">
                      {open
                        ? `Product link ${index + 1} · yours`
                        : `Product link ${index + 1} · booked`}
                    </span>
                    <span className="text-xs tabular-nums text-invert-fg/60">
                      {formatMoney(bioLink.priceMonthlyCents)}/mo
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex items-end justify-between border-t border-invert-fg/15 pt-5">
              <p className="text-2xl font-semibold tabular-nums">
                {formatMoney(bioLink.priceMonthlyCents)}
                <span className="text-sm font-normal text-invert-fg/60">
                  /month
                </span>
              </p>
              <ButtonLink
                href={`/book?slots=${bioLink.slotKey}`}
                variant="primary"
                size="sm"
              >
                {bioAvailable ? "Book a link" : "See dates"}
                <ButtonArrow />
              </ButtonLink>
            </div>
          </Card>
        ) : null}

        <Card className="bmp-lift lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge>Cover photo</Badge>
              <h3 className="mt-3 text-xl font-bold">
                Two halves, one brand each
              </h3>
            </div>
            <Badge tone={openCoverSlots > 0 ? "success" : "danger"}>
              {openCoverSlots} of {coverSlots.length} open
            </Badge>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            The cover is split straight down the middle. You get one full half
            for your logo and tagline, seen by everyone who opens the profile.
            Book both halves for the whole cover and a bundle discount applies.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {coverSlots.map((slot) => {
              const open = availability[slot.slotKey]?.available ?? false;
              return (
                <div
                  key={slot.id}
                  className={cx(
                    "flex aspect-[4/3] flex-col items-center justify-center rounded-xl p-3 text-center ring-1",
                    open
                      ? "bmp-option bg-accent-wash ring-accent/40 hover:ring-accent"
                      : "bg-subtle ring-line transition-colors",
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider">
                    {slot.label.replace("Cover · ", "")}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-muted">
                    {formatMoney(slot.priceMonthlyCents)}/mo
                  </p>
                  {open ? (
                    <Link
                      href={`/book?slots=${slot.slotKey}`}
                      className="mt-2 text-xs font-semibold text-accent transition-colors hover:text-foreground"
                    >
                      Book &rarr;
                    </Link>
                  ) : (
                    <span className="mt-2 text-xs text-muted">Booked</span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {promoPost ? (
        <Card className="mt-5 flex flex-col gap-5 border-accent/35 bg-accent-wash sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone="accent">Add-on · 30% off with any placement</Badge>
            <h3 className="mt-3 text-lg font-bold">
              {promoPost.label}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              {promoPost.details}
            </p>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-2xl font-semibold tabular-nums">
              {formatMoney(promoPost.priceMonthlyCents)}
            </p>
            <p className="text-xs text-muted">one-off</p>
          </div>
        </Card>
      ) : null}
    </Section>
  );
}
