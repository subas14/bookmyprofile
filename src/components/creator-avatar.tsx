import Image from "next/image";

import { cx } from "@/components/ui";

/**
 * Creator profile picture. Falls back to the display-name initial when no
 * avatar has been set, so the layout never shows a broken image.
 */
export function CreatorAvatar({
  src,
  name,
  size = 48,
  className,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  if (!src) {
    return (
      <span
        aria-hidden
        className={cx(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-subtle-strong font-bold text-muted",
          className,
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {name.charAt(0)}
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt={`${name}'s profile picture`}
      width={size}
      height={size}
      priority={size >= 96}
      className={cx("shrink-0 rounded-full object-cover", className)}
    />
  );
}
