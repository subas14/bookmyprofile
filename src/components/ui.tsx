import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

/**
 * Shared presentational primitives.
 *
 * Kept as plain server-renderable components (no client JS) so marketing pages
 * stay fully static and fast.
 */

/**
 * Joins class names, dropping falsy values, then resolves Tailwind conflicts
 * so later classes win. Without the merge step, a caller passing
 * `bg-foreground text-background` to `<Card>` lost to the base `bg-surface`
 * (Tailwind emits utilities in its own fixed order, not the class-attribute
 * order), which rendered near-white text on a near-white surface.
 */
export function cx(...values: (string | false | null | undefined)[]): string {
  return twMerge(values.filter(Boolean).join(" "));
}

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cx(
        "relative mx-auto w-full max-w-7xl px-5 py-20 sm:px-8",
        className,
      )}
    >
      {children}
    </section>
  );
}

/**
 * Small pill label. Used for section eyebrows and inline status chips: the
 * rounded-full chip is the core motif of the design language.
 */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold tracking-wide text-muted">
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cx(
        "flex flex-col gap-4",
        align === "center"
          ? "items-center text-center"
          : "items-start text-left",
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.08]">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-line bg-surface p-6 transition-colors",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A flat, borderless tile used inside cards and stat grids. */
export function Tile({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx("rounded-xl bg-subtle p-4", className)}>{children}</div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

/**
 * Fully rounded buttons, matching the pill motif. No gradients, no glow.
 *
 * Motion lives in `.bmp-btn*` (globals.css): the primary variant gets a
 * darker sheet that sweeps in from the left on hover, every variant presses
 * down on click, and an optional arrow slides in via `<ButtonArrow />`.
 */
const BUTTON_BASE =
  "bmp-btn group/btn inline-flex items-center justify-center gap-2 rounded-full font-semibold disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bmp-btn-primary bg-accent text-accent-fg",
  secondary:
    "bmp-btn-secondary border border-line bg-surface text-foreground hover:border-line-strong hover:bg-subtle",
  ghost: "text-muted hover:text-foreground",
};

/**
 * Arrow that slides in from the right when the parent button is hovered.
 * Drop it after the label: `<ButtonLink>Book <ButtonArrow /></ButtonLink>`.
 */
export function ButtonArrow() {
  return (
    <span aria-hidden className="bmp-btn-arrow">
      <svg
        width="14"
        height="14"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 10h12M11 5l5 5-5 5" />
      </svg>
    </span>
  );
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-[15px]",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cx(
    BUTTON_BASE,
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button className={buttonClass(variant, size, className)} {...props} />
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  external,
  onClick,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  external?: boolean;
  /** Optional click handler, e.g. to dismiss the mobile nav drawer on tap. */
  onClick?: () => void;
}) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass(variant, size, className)}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      className={buttonClass(variant, size, className)}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

/**
 * A labelled statistic, used across the hero and analytics pages.
 *
 * `delta` mirrors how X Analytics reports period-over-period change: a signed
 * percentage rendered green when up and red when down. `sub` prints a secondary
 * denominator inline (e.g. "1.8K / 6.9K").
 */
export function StatCard({
  label,
  value,
  sub,
  hint,
  delta,
  emphasis,
}: {
  label: string;
  value: string;
  sub?: string;
  hint?: string;
  /** Percentage change vs. the previous comparable window. */
  delta?: number | null;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border p-5 transition-colors",
        emphasis
          ? "border-accent/35 bg-accent-wash"
          : "border-line bg-surface",
      )}
    >
      <dt className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
        {label}
      </dt>
      <dd className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[1.75rem] font-bold leading-none tracking-tight tabular-nums">
          {value}
        </span>
        {sub ? (
          <span className="text-sm tabular-nums text-faint">/ {sub}</span>
        ) : null}
        {delta !== undefined && delta !== null ? <Delta value={delta} /> : null}
      </dd>
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/** Signed period-over-period change, e.g. `↑ 797%` / `↓ -51%`. */
export function Delta({ value }: { value: number }) {
  const up = value >= 0;
  const magnitude = Math.abs(value);
  const formatted = magnitude >= 10 ? Math.round(magnitude) : magnitude.toFixed(1);
  return (
    <span
      className={cx(
        "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
        up ? "text-success" : "text-danger",
      )}
    >
      <span aria-hidden>{up ? "↑" : "↓"}</span>
      <span>
        {up ? "" : "-"}
        {formatted}%
      </span>
      <span className="sr-only">
        {up ? "up" : "down"} {formatted} percent versus the previous period
      </span>
    </span>
  );
}

/** Horizontal share bar used for audience breakdowns. */
export function ShareBar({
  label,
  share,
  value,
}: {
  label: string;
  /** Fraction between 0 and 1. */
  share: number;
  value: string;
}) {
  const pct = Math.max(0, Math.min(100, share * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="text-foreground">{label}</span>
        <span className="tabular-nums text-muted">{value}</span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-subtle-strong"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
}) {
  const tones = {
    neutral: "border-line bg-subtle text-muted",
    success: "border-success/30 bg-success-wash text-success",
    warning: "border-warning/30 bg-warning-wash text-warning",
    danger: "border-danger/30 bg-danger-wash text-danger",
    accent: "border-accent/30 bg-accent-wash text-accent",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Check-marked trust/transparency bullet. */
export function TrustItem({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden
        className="mt-1 h-fit rounded-full bg-success p-1 text-success ring-1 ring-success"
      >
        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted">{children}</p>
      </div>
    </div>
  );
}

/** Empty-state panel used by dashboards and lookup pages. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-panel p-10 text-center">
      <p className="text-base font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
