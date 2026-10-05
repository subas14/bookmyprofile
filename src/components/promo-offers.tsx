import { ButtonArrow, ButtonLink, cx } from "@/components/ui";
import { PostVisual } from "@/components/home/placement-visuals";
import { formatMoney } from "@/lib/format";

/**
 * Dedicated-post offers.
 *
 * Display-only: these are booked by messaging the creator on X, not through
 * the checkout, so the pricing engine and the payment flow are unchanged.
 * Change or retire an offer here; both the landing page and /pricing read
 * from this list.
 */
export const PROMO_OFFERS = [
  {
    id: "promo-post-week",
    title: "Dedicated Promo Post",
    tag: "Pinned for 1 week",
    priceCents: 13_000,
    body: "A standalone post about your product, written in my voice, kept live permanently and pinned to the top of my profile for 7 days.",
    points: ["Written in my voice", "Pinned 7 days", "Stays live after"],
    featured: false,
  },
  {
    id: "promo-post-combo",
    title: "Dedicated Post + any placement",
    tag: "Best value",
    priceCents: 20_000,
    body: "The pinned dedicated post plus your choice of a cover half or a product link in the bio, so people who open the profile after the post see you again.",
    points: ["Pinned post, 7 days", "Cover half or bio link", "One price, one DM"],
    featured: true,
  },
] as const;

export function PromoOffers({
  profileUrl,
  handle,
  className,
}: {
  profileUrl: string;
  handle: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Post offers
          </p>
          <h3 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            Get a dedicated post.
          </h3>
        </div>
        <p className="text-sm text-muted">
          Booked by DM on X with {handle}, not through checkout.
        </p>
      </div>

      <ul className="mt-5 grid gap-4 md:grid-cols-2">
        {PROMO_OFFERS.map((offer) => (
          <li
            key={offer.id}
            className={cx(
              "bmp-lift relative flex flex-col rounded-2xl border bg-surface p-5 shadow-[var(--shadow-card)] sm:p-6",
              offer.featured ? "border-accent/60" : "border-line",
            )}
          >
            {offer.featured ? (
              <span className="absolute -top-2.5 right-5 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent-fg">
                {offer.tag}
              </span>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-[1fr_9.5rem] sm:items-start">
              <div className="min-w-0">
                <h4 className="text-base font-bold leading-snug tracking-tight">
                  {offer.title}
                </h4>
                {!offer.featured ? (
                  <p className="mt-1 text-xs font-semibold text-accent">
                    {offer.tag}
                  </p>
                ) : null}
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {offer.body}
                </p>
              </div>
              <PostVisual pinnedLabel="Pinned 7d" />
            </div>

            <ul className="mt-4 flex flex-wrap gap-2">
              {offer.points.map((point) => (
                <li
                  key={point}
                  className="rounded-full border border-line bg-subtle px-2.5 py-1 text-xs font-medium text-muted"
                >
                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
              <p className="tabular-nums">
                <span className="text-2xl font-bold tracking-tight">
                  {formatMoney(offer.priceCents)}
                </span>
                <span className="ml-1 text-xs text-muted">one-off</span>
              </p>
              <ButtonLink
                href={profileUrl}
                external
                size="sm"
                variant={offer.featured ? "primary" : "secondary"}
              >
                DM to book
                <ButtonArrow />
              </ButtonLink>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
