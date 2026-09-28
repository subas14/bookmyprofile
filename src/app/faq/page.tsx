import type { Metadata } from "next";

import { ButtonLink, Card, Section } from "@/components/ui";
import { FAQ_GROUPS } from "@/app/faq/faq-content";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers on availability, creative specs, payments, refunds, exclusivity " +
    "and reporting for BookMyProfile placements.",
};

export default function FaqPage() {
  // Structured data so the answers can surface directly in search results.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_GROUPS.flatMap((group) =>
      group.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="border-b border-line">
        <Section className="py-16 text-center sm:py-20">
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            Questions, answered plainly.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            If something is not covered here, ask before you book. I would
            rather answer a question than process a refund.
          </p>
        </Section>
      </div>

      <Section className="py-16">
        <div className="mx-auto max-w-3xl space-y-12">
          {FAQ_GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-accent">
                {group.title}
              </h2>
              <div className="mt-5 space-y-3">
                {group.items.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-2xl bg-surface ring-1 ring-line transition-colors hover:ring-line-strong"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium">
                      {item.q}
                      <span
                        aria-hidden
                        className="shrink-0 text-muted transition-transform group-open:rotate-45"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1Z" />
                        </svg>
                      </span>
                    </summary>
                    <p className="px-5 pb-5 text-sm leading-relaxed text-muted">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}

          <Card className="text-center">
            <h2 className="text-lg font-bold">
              Still deciding?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Look at the raw analytics first. Every figure is dated and
              sourced, so you can make the call on the numbers alone.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/analytics" variant="secondary">
                View analytics
              </ButtonLink>
              <ButtonLink href="/book">Book a placement</ButtonLink>
            </div>
          </Card>
        </div>
      </Section>
    </>
  );
}
