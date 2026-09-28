import { cx } from "@/components/ui";

/**
 * Animated brand mark.
 *
 * A small calendar in the accent colour. On a loop, a cursor moves onto one
 * slot, the slot fills, and a check pops in: a booking happening in
 * miniature. Pure CSS keyframes, no client JS, honours reduced-motion.
 */
export function BrandMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-accent text-accent-fg",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.66}
        height={size * 0.66}
        viewBox="0 0 24 24"
        fill="none"
      >
        {/* Calendar body */}
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        {/* Header rule + rings */}
        <path
          d="M3 9.5h18M8 3v3.5M16 3v3.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Empty slots */}
        <rect x="6.2" y="12" width="4.6" height="2.4" rx="1" fill="currentColor" opacity="0.35" />
        <rect x="13.2" y="12" width="4.6" height="2.4" rx="1" fill="currentColor" opacity="0.35" />
        <rect x="13.2" y="16.2" width="4.6" height="2.4" rx="1" fill="currentColor" opacity="0.35" />
        {/* The slot that gets booked */}
        <rect
          className="bmp-mark-slot"
          x="6.2"
          y="16.2"
          width="4.6"
          height="2.4"
          rx="1"
          fill="currentColor"
        />
        {/* Check that confirms the booking */}
        <g className="bmp-mark-check">
          <circle cx="18.5" cy="6" r="4.2" fill="var(--success)" />
          <path
            d="m16.5 6 1.4 1.4 2.6-2.6"
            stroke="#fff"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        {/* Cursor that comes in to click the slot */}
        <path
          className="bmp-mark-cursor"
          d="M8 15.5 10.8 22l.9-2.6 2.6-.9L8 15.5Z"
          fill="#fff"
          stroke="var(--foreground)"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
