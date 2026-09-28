import { ButtonArrow, ButtonLink, cx } from "@/components/ui";
import { formatMoney } from "@/lib/format";

/**
 * One pricing tier. The highlighted tier is inverted (foreground on
 * background) and stands a little taller than its neighbours.
 */
export function TierCard({
  eyebrow,
  title,
  description,
  perMonthCents,
  listMonthlyCents,
  totalCents,
  months,
  cpm,
  availability,
  available,
  features,
  href,
  highlighted,
  promoNote,
}: {
  eyebrow: string;
  title: string;
  description: string;
  perMonthCents: number;
  listMonthlyCents: number;
  totalCents: number;
  months: number;
  cpm: number;
  availability: string;
  available: boolean;
  features: string[];
  href: string;
  highlighted?: boolean;
  promoNote?: boolean;
}) {
  const discounted = perMonthCents < Math.round(listMonthlyCents);
  const dim = highlighted ? "text-invert-fg/60" : "text-muted";

  return (
    <div
      className={cx(
        "bmp-option relative flex flex-col rounded-[1.5rem] border p-6 sm:p-7",
        highlighted
          ? "border-invert-line bg-invert text-invert-fg shadow-[var(--shadow-pop)] lg:-my-3 lg:py-10"
          : "border-line bg-surface",
      )}
    >
      {highlighted ? (
        <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-fg">
          Most popular
        </span>
      ) : null}

      <p className={cx("text-xs font-semibold uppercase tracking-wider", dim)}>
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-bold tracking-tight">{title}</h2>
      <p
        className={cx(
          "mt-2 text-sm leading-relaxed",
          highlighted ? "text-invert-fg/70" : "text-muted",
        )}
      >
        {description}
      </p>

      <div className="mt-6 flex items-end gap-2">
        <span className="text-[2.6rem] font-extrabold leading-none tracking-tight tabular-nums">
          {formatMoney(perMonthCents)}
        </span>
        <span className={cx("pb-1.5 text-sm", dim)}>/month</span>
        {discounted ? (
          <span
            className={cx(
              "pb-1.5 text-sm tabular-nums line-through",
              highlighted ? "text-invert-fg/40" : "text-faint",
            )}
          >
            {formatMoney(Math.round(listMonthlyCents))}
          </span>
        ) : null}
      </div>
      <p className={cx("mt-1.5 text-xs tabular-nums", dim)}>
        {formatMoney(totalCents)} for {months} month{months === 1 ? "" : "s"}
        {promoNote ? " incl. promo post" : ""}
        {cpm > 0 ? ` · ≈ $${cpm.toFixed(3)} CPM` : ""}
      </p>

      <p className="mt-4 inline-flex items-center gap-2 text-xs font-medium">
        <span
          aria-hidden
          className={cx(
            "h-1.5 w-1.5 rounded-full",
            available ? "bmp-live-dot bg-success" : "bg-danger",
          )}
        />
        {availability}
      </p>

      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-sm">
            <span
              aria-hidden
              className={cx(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                highlighted
                  ? "bg-invert-fg/15 text-invert-fg"
                  : "bg-success-wash text-success",
              )}
            >
              <svg width="9" height="9" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span className={highlighted ? "text-invert-fg/85" : ""}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <ButtonLink
        href={href}
        variant={highlighted ? "primary" : "secondary"}
        className="mt-8 w-full"
      >
        {available ? "Book this" : "Check dates"}
        <ButtonArrow />
      </ButtonLink>
    </div>
  );
}
