import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { ButtonArrow, ButtonLink } from "@/components/ui";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "/#inventory", label: "Placements" },
  { href: "/analytics", label: "Analytics" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/campaigns", label: "My campaign" },
];

/**
 * Sticky site header: animated brand mark, nav, theme switch and the primary
 * CTA.
 *
 * Flat surface with a single hairline rule, no blur or translucency, which
 * reads cheap against the paper palette.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        {/* Wordmark: the mark plays a tiny booking on loop. */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="BookMyProfile home"
        >
          <BrandMark
            size={32}
            className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105"
          />
          <span className="text-[15px] font-bold tracking-tight">
            Book<span className="text-accent">My</span>Profile
          </span>
        </Link>

        {/* Nav pills */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-subtle hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {/* Primary CTA stays visible at every width. */}
          <ButtonLink href="/book" size="sm">
            Book a slot
            <ButtonArrow />
          </ButtonLink>
          {/* Hamburger drawer holds the full nav below `lg`. */}
          <MobileNav links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
