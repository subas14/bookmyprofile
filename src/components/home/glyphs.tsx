import type { DailyMetricView } from "@/components/home/types";

/**
 * Small presentational glyphs shared by the landing-page sections.
 * Pure SVG, server-rendered, no client JS.
 */

export function XGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M18.2 2h3.4l-7.4 8.5L23 22h-6.8l-5.3-7-6.1 7H1.4l7.9-9.1L1 2h7l4.8 6.4L18.2 2Zm-1.2 18h1.9L7.1 3.9H5.1L17 20Z" />
    </svg>
  );
}

export function VerifiedGlyph({ size = 15 }: { size?: number }) {
  return (
    <svg
      aria-label="Verified"
      role="img"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      className="shrink-0 text-accent"
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
  );
}

export function CheckGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 0 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Tiny impressions sparkline that draws itself in on load. */
export function Sparkline({
  days,
  width = 120,
  height = 32,
  className,
}: {
  days: DailyMetricView[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (days.length < 2) return null;
  const peak = Math.max(1, ...days.map((day) => day.impressions));
  const step = width / (days.length - 1);
  const points = days.map((day, index) => {
    const x = index * step;
    const y = height - (day.impressions / peak) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const path = `M${points.join(" L")}`;
  const area = `${path} L${width},${height} L0,${height} Z`;

  return (
    <svg
      aria-hidden
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className ?? "block overflow-visible"}
    >
      <path d={area} fill="var(--accent)" opacity="0.12" />
      <path
        d={path}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        className="bmp-sparkline"
      />
    </svg>
  );
}
