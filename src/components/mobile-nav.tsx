"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ButtonArrow, ButtonLink } from "@/components/ui";

export interface NavLink {
  href: string;
  label: string;
}

/**
 * Mobile navigation.
 *
 * The desktop header hides the link row below `lg`, so on phones and tablets
 * this hamburger is the only way to reach Placements, Pricing, FAQ and the
 * campaign lookup. Opening the drawer:
 *  - locks body scroll so the page behind cannot move,
 *  - closes on Escape, on backdrop tap and on any link tap,
 *  - is fully labelled for assistive tech (`aria-expanded` / `aria-controls`).
 *
 * Rendered as a client island so the surrounding header stays a static server
 * component.
 */
export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // Lock body scroll and wire up Escape while the drawer is open.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-foreground"
      >
        <svg
          aria-hidden
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M3 6h18M3 12h18M3 18h18" />
          )}
        </svg>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="absolute inset-0 bg-foreground/40"
          />

          {/* Panel */}
          <div
            id="mobile-nav-panel"
            className="absolute right-0 top-0 flex h-full w-[min(20rem,85vw)] flex-col border-l border-line bg-background shadow-[var(--shadow-pop)]"
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <span className="text-[15px] font-bold tracking-tight">
                Book<span className="text-accent">My</span>Profile
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-foreground"
              >
                <svg
                  aria-hidden
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav
              aria-label="Mobile navigation"
              className="flex flex-1 flex-col gap-1 overflow-y-auto p-4"
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-subtle"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-line p-4">
              <ButtonLink href="/book" size="md" className="w-full" onClick={close}>
                Book a slot
                <ButtonArrow />
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
