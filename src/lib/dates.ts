import { LAUNCH_TERM_DAYS, isLaunchTerm } from "@/lib/domain";

/**
 * Date helpers.
 *
 * Campaign terms are whole-month and timezone-insensitive, so every boundary is
 * normalised to UTC midnight. This keeps availability maths deterministic
 * regardless of where the server or advertiser is located.
 */

/** Strips the time component, pinning the date to UTC midnight. */
export function startOfUtcDay(value: Date | string): Date {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function todayUtc(): Date {
  return startOfUtcDay(new Date());
}

/**
 * Adds whole months, clamping to the last valid day of the target month so
 * 31 Jan + 1 month becomes 28/29 Feb rather than rolling into March.
 */
export function addMonthsUtc(value: Date, months: number): Date {
  const date = startOfUtcDay(value);
  const day = date.getUTCDate();
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

export function addDaysUtc(value: Date, days: number): Date {
  const date = startOfUtcDay(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

/**
 * End date for a term of `months` starting at `start`. The launch-special
 * sentinel (`months === 0`) is a fixed 14-day window instead.
 */
export function termEndDate(start: Date, months: number): Date {
  return isLaunchTerm(months)
    ? addDaysUtc(start, LAUNCH_TERM_DAYS)
    : addMonthsUtc(start, months);
}

/** Inclusive-start / exclusive-end overlap test. */
export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function daysBetween(start: Date, end: Date): number {
  return Math.round(
    (startOfUtcDay(end).getTime() - startOfUtcDay(start).getTime()) /
      86_400_000,
  );
}

/** `YYYY-MM-DD` for use in `<input type="date">`. */
export function toDateInputValue(value: Date | string): string {
  return startOfUtcDay(value).toISOString().slice(0, 10);
}

/**
 * Progress of a campaign through its term, clamped to 0..1.
 * Used to render campaign timelines in the advertiser dashboard.
 */
export function termProgress(start: Date, end: Date, now = new Date()): number {
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 1;
  const elapsed = now.getTime() - start.getTime();
  return Math.min(1, Math.max(0, elapsed / total));
}
