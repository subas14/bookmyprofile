/**
 * Presentation helpers. All monetary values move through the app as integer
 * cents; formatting to a human string happens only at the edges.
 */

import { LAUNCH_TERM_DAYS, isLaunchTerm } from "@/lib/domain";

/** Human term length: `1` -> `"1 month"`, `6` -> `"6 months"`, launch -> `"2 weeks"`. */
export function formatTerm(months: number): string {
  if (isLaunchTerm(months)) return `${LAUNCH_TERM_DAYS / 7} weeks`;
  return `${months} month${months === 1 ? "" : "s"}`;
}

/** `4999` -> `"$49.99"`, `5000` -> `"$50"`. */
export function formatMoney(cents: number, currency = "USD"): string {
  const hasFraction = cents % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(cents / 100);
}

/** `22000000` -> `"22M"`, `7400000` -> `"7.4M"`, `12500` -> `"12.5K"`. */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** `1234567` -> `"1,234,567"`. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Basis points to a display percentage: `1250` -> `"12.5%"`. */
export function formatBps(bps: number): string {
  const pct = bps / 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
}

/** Ratio as a percentage string with the given precision: `0.0342` -> `"3.42%"`. */
export function formatRatio(ratio: number, digits = 2): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

/** Cost per mille (per 1,000 impressions) given spend + impressions. */
export function costPerMille(cents: number, impressions: number): number {
  if (impressions <= 0) return 0;
  return (cents / 100 / impressions) * 1000;
}
