import { ButtonArrow, ButtonLink, Section } from "@/components/ui";
import { formatCompactNumber } from "@/lib/format";

/**
 * Closing CTA: an inverted panel (foreground on background) so the page ends
 * on its strongest contrast, with the live open-slot count as the hook.
 */
export function FinalCtaSection({
  monthlyImpressions,
  openCount,
}: {
  monthlyImpressions?: number;
  openCount: number;
}) {
  return (
    <Section className="py-16 sm:py-24">
      <div className="relative overflow-hidden rounded-[2rem] bg-invert px-6 py-16 text-center text-invert-fg sm:px-12 sm:py-20">
        {/* Dot field, inverted for the panel. */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(var(--invert-fg) 0.6px, transparent 0.6px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-invert-fg/20 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-invert-fg/80">
            <span
              aria-hidden
              className="bmp-live-dot h-1.5 w-1.5 rounded-full bg-success"
            />
            {openCount === 0
              ? "All placements booked"
              : `${openCount} placement${openCount === 1 ? "" : "s"} open`}
          </span>
          <h2 className="mx-auto mt-6 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-5xl sm:leading-[1.05]">
            Put your product in front of{" "}
            {monthlyImpressions ? formatCompactNumber(monthlyImpressions) : "7M"}{" "}
            impressions a month.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-invert-fg/70">
            {openCount === 0
              ? "Every placement is currently booked. Check upcoming availability dates."
              : "Each placement is exclusive for the length of your term. Fixed price, no sales call, live within a day of sending your creative."}
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/book" size="lg">
              Book a placement
              <ButtonArrow />
            </ButtonLink>
            <ButtonLink
              href="/faq"
              variant="secondary"
              size="lg"
              className="border-invert-fg/25 bg-transparent text-invert-fg hover:border-invert-fg/50 hover:bg-invert-fg/10"
            >
              Read the FAQ
            </ButtonLink>
          </div>
        </div>
      </div>
    </Section>
  );
}
