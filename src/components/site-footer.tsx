import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

const FOOTER_SECTIONS = [
  {
    title: "Product",
    links: [
      { href: "/book", label: "Book a placement" },
      { href: "/pricing", label: "Pricing" },
      { href: "/analytics", label: "Audience analytics" },
      { href: "/campaigns", label: "Track your campaign" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/transparency", label: "Transparency" },
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-panel">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <BrandMark size={32} />
              <span className="text-[15px] font-bold tracking-tight">
                BookMyProfile
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Advertising inventory on a real X profile. Published analytics,
              fixed monthly pricing, one brand per slot. No negotiation and no
              guesswork.
            </p>
            <a
              href="https://x.com/shub0414"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent underline-offset-2 hover:underline"
            >
              @shub0414 on X
              <span aria-hidden>&rarr;</span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:gap-16">
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title}>
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  {section.title}
                </p>
                <ul className="mt-4 space-y-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} BookMyProfile. All rights reserved.</p>
          <p>
            Payments processed securely by{" "}
            <a
              href="https://dodopayments.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent transition-colors hover:text-foreground"
            >
              Dodo Payments
            </a>
            , merchant of record.
          </p>
        </div>
      </div>
    </footer>
  );
}
