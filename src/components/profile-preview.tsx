import {
  BIO_LINK_MAX_CONCURRENT,
  BIO_LINK_SLOT_KEY,
  COVER_SLOT_LABELS,
  COVER_SLOT_POSITIONS,
  type CoverSlotKey,
} from "@/lib/domain";
import { cx } from "@/components/ui";
import { CreatorAvatar } from "@/components/creator-avatar";
import { formatMoney } from "@/lib/format";
import { termMonthlyRateCents } from "@/lib/pricing";

/**
 * A mock of the creator's X profile showing exactly where each purchasable
 * placement appears: the two cover-photo halves and the product links in the
 * bio (up to three at once).
 *
 * The cover is divided straight down the middle: each sponsor gets one full
 * half of the image, not a small corner badge.
 *
 * `highlight` dims everything except the given slots, which the booking page
 * uses to preview the current selection.
 */
export function ProfilePreview({
  displayName,
  handle,
  headline,
  avatarUrl,
  takenSlots = [],
  bioLinksTaken = 0,
  highlight,
  coverPrices,
  bioLinkPriceCents,
}: {
  displayName: string;
  handle: string;
  headline: string;
  avatarUrl?: string | null;
  /** Slot keys already fully booked, rendered as unavailable. */
  takenSlots?: string[];
  /** How many of the bio's product-link lines are currently occupied. */
  bioLinksTaken?: number;
  /** Slot keys to emphasise; when omitted every slot is shown equally. */
  highlight?: string[];
  /** Monthly list price per cover half, printed on the half when provided. */
  coverPrices?: Partial<Record<CoverSlotKey, number>>;
  /** Monthly list price of a bio link, shown on the first free line. */
  bioLinkPriceCents?: number;
}) {
  const coverSlots = Object.keys(COVER_SLOT_POSITIONS) as CoverSlotKey[];
  const isHighlighting = highlight !== undefined && highlight.length > 0;

  const slotState = (key: string) => {
    if (takenSlots.includes(key)) return "taken" as const;
    if (isHighlighting) {
      return highlight.includes(key) ? ("active" as const) : ("idle" as const);
    }
    return "open" as const;
  };

  /** Bio-link line styles (bordered rows under the bio). */
  const lineStyles = {
    taken: "border-line-strong bg-subtle-strong text-faint",
    active: "border-accent bg-accent text-accent-fg",
    idle: "border-line bg-subtle text-faint opacity-55",
    open: "border-dashed border-accent bg-accent-wash text-accent",
  } as const;

  /**
   * Cover half styles: the framed "ad space" panel inside each half. Open
   * halves read as a dashed, for-sale frame; the booking page's selection
   * fills solid accent.
   */
  const halfStyles = {
    taken: "border-line-strong bg-subtle-strong/80 text-faint",
    active: "border-accent bg-accent text-accent-fg shadow-[var(--shadow-pop)]",
    idle: "border-line bg-surface/60 text-faint opacity-60",
    open: "border-dashed border-accent/50 bg-surface/75 text-foreground",
  } as const;

  const bioState = slotState(BIO_LINK_SLOT_KEY);
  const taken = Math.min(BIO_LINK_MAX_CONCURRENT, Math.max(0, bioLinksTaken));

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      {/*
        Cover photo, split straight down the middle. Each half is one
        purchasable slot, drawn as a framed ad space carrying its own price, so
        an advertiser sees exactly how much of the image they get and what it
        costs.
      */}
      <div className="relative h-44 w-full overflow-hidden bg-panel sm:h-56">
        <div className="bmp-paper absolute inset-0" aria-hidden />

        {coverSlots.map((key) => {
          const state = slotState(key);
          const price = coverPrices?.[key];
          const yearly =
            price !== undefined ? termMonthlyRateCents(price, 12) : undefined;
          const solid = state === "active";
          return (
            <div
              key={key}
              className={cx(
                "absolute p-2 sm:p-3",
                COVER_SLOT_POSITIONS[key],
              )}
            >
              <div
                className={cx(
                  "relative flex h-full w-full flex-col items-center justify-center rounded-xl border-2 px-2 text-center transition-all",
                  halfStyles[state],
                  // Lift the content clear of the avatar overlapping the cover.
                  key === "cover-left" && "pb-9 sm:pb-8",
                )}
              >
                {/* Position tag + live status */}
                <span
                  className={cx(
                    "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:left-2.5 sm:top-2.5 sm:text-[10px]",
                    solid
                      ? "bg-accent-fg/15 text-accent-fg"
                      : "bg-foreground text-background",
                  )}
                >
                  {COVER_SLOT_LABELS[key]}
                </span>
                <span
                  className={cx(
                    "absolute right-2 top-2 inline-flex items-center gap-1 text-[9px] font-semibold sm:right-2.5 sm:top-2.5 sm:text-[10px]",
                    solid ? "text-accent-fg/85" : state === "taken" ? "text-faint" : "text-success",
                  )}
                >
                  <span
                    aria-hidden
                    className={cx(
                      "h-1.5 w-1.5 rounded-full",
                      state === "taken"
                        ? "bg-danger"
                        : solid
                          ? "bg-accent-fg"
                          : "bmp-live-dot bg-success",
                    )}
                  />
                  {state === "taken" ? "Booked" : "Open"}
                </span>

                <span
                  className={cx(
                    "mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] sm:text-[11px]",
                    solid ? "text-accent-fg/85" : "text-accent",
                  )}
                >
                  {state === "taken" ? "Taken this term" : "Your brand here"}
                </span>

                {price !== undefined ? (
                  <span className="mt-1 flex items-baseline gap-0.5">
                    <span
                      className={cx(
                        "text-[1.9rem] font-extrabold leading-none tracking-tight tabular-nums sm:text-[2.5rem]",
                        state === "taken" && "line-through decoration-2",
                      )}
                    >
                      {formatMoney(price)}
                    </span>
                    <span
                      className={cx(
                        "text-xs font-medium",
                        solid ? "text-accent-fg/80" : "text-muted",
                      )}
                    >
                      /mo
                    </span>
                  </span>
                ) : (
                  <span className="mt-1 text-lg font-extrabold tracking-tight">
                    Your brand
                  </span>
                )}

                <span
                  className={cx(
                    "mt-1 text-[9px] font-medium leading-tight sm:text-[11px]",
                    solid ? "text-accent-fg/80" : "text-muted",
                  )}
                >
                  {yearly !== undefined && yearly < (price ?? 0) ? (
                    <>
                      1⁄2 of cover ·{" "}
                      <span className={solid ? "" : "font-semibold text-success"}>
                        {formatMoney(yearly)}/mo yearly
                      </span>
                    </>
                  ) : (
                    "1⁄2 of cover"
                  )}
                </span>
              </div>
            </div>
          );
        })}

        {/* Centre seam dividing the cover into two equal halves */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-3 bottom-3 w-px -translate-x-1/2 border-l border-dashed border-line-strong"
        />
      </div>

      {/* Profile body */}
      <div className="relative px-5 pb-6">
        {/* Avatar overlapping the cover, exactly as X lays it out. */}
        <div className="absolute -top-10 left-5 rounded-full border-4 border-surface bg-surface">
          <CreatorAvatar src={avatarUrl} name={displayName} size={72} />
        </div>
        <div className="pt-12">
          <div className="flex items-center gap-1.5">
            <p className="text-lg font-bold tracking-tight">{displayName}</p>
            {/* Verified mark, drawn in the accent rather than platform blue. */}
            <svg
              aria-label="Verified"
              role="img"
              width="15"
              height="15"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="text-accent"
            >
              <path d="M10 1.2 12 3l2.6-.3 1 2.5 2.3 1.3-.7 2.5.7 2.5-2.3 1.3-1 2.5-2.6-.3-2 1.8-2-1.8-2.6.3-1-2.5L1.1 12l.7-2.5L1.1 7l2.3-1.3 1-2.5L7 3.5l3-2.3Z" />
              <path
                d="m6.8 10.2 2 2 4.4-4.4"
                stroke="var(--surface)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <p className="text-sm text-muted">{handle}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{headline}</p>

          {/* Product links in the bio: up to three lines, one brand each. */}
          <div className="mt-4 space-y-1.5">
            {Array.from({ length: BIO_LINK_MAX_CONCURRENT }, (_, index) => {
              const lineTaken = index < taken;
              // The first free line takes the selection/open state; the rest
              // of the free lines are shown as quietly available.
              const isFirstFree = !lineTaken && index === taken;
              const state = lineTaken
                ? ("taken" as const)
                : bioState === "taken"
                  ? ("taken" as const)
                  : isFirstFree
                    ? bioState
                    : isHighlighting
                      ? ("idle" as const)
                      : ("open" as const);
              return (
                <div
                  key={index}
                  className={cx(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] transition-all",
                    lineStyles[state],
                    !isFirstFree && !lineTaken && "opacity-70",
                  )}
                >
                  <LinkGlyph />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {lineTaken
                      ? `Product ${index + 1} · booked`
                      : isFirstFree
                        ? "yourproduct.com · your link here"
                        : `Product link ${index + 1} · open`}
                  </span>
                  {isFirstFree && bioLinkPriceCents !== undefined ? (
                    <span className="shrink-0 text-xs font-semibold tabular-nums">
                      {formatMoney(bioLinkPriceCents)}/mo
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            {BIO_LINK_MAX_CONCURRENT - taken} of {BIO_LINK_MAX_CONCURRENT} bio
            links open
          </p>

          <p className="mt-4 text-xs text-muted">
            Illustrative preview. Final creative is agreed with the creator
            before a campaign goes live.
          </p>
        </div>
      </div>
    </div>
  );
}

function LinkGlyph() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="shrink-0"
    >
      <path d="M12.6 7.4a3.4 3.4 0 0 1 0 4.8l-2.4 2.4a3.4 3.4 0 0 1-4.8-4.8l1.2-1.2a1 1 0 0 1 1.4 1.4l-1.2 1.2a1.4 1.4 0 0 0 2 2l2.4-2.4a1.4 1.4 0 0 0 0-2 1 1 0 0 1 1.4-1.4Z" />
      <path d="M7.4 12.6a3.4 3.4 0 0 1 0-4.8l2.4-2.4a3.4 3.4 0 0 1 4.8 4.8l-1.2 1.2a1 1 0 0 1-1.4-1.4l1.2-1.2a1.4 1.4 0 0 0-2-2L8.8 9.2a1.4 1.4 0 0 0 0 2 1 1 0 0 1-1.4 1.4Z" />
    </svg>
  );
}
