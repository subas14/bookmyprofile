import { Card, Section, SectionHeading } from "@/components/ui";

const STEPS = [
  {
    title: "Pick your placement",
    body: "Choose a product link in the bio, either half of the cover, or bundle several for a discount.",
  },
  {
    title: "Choose your term",
    body: "One to twelve months, or a two-week launch special on the bio link. Pay yearly and save 30% automatically.",
  },
  {
    title: "Pay securely",
    body: "Checkout is handled by Dodo Payments, with card, wallet or crypto, with an invoice.",
  },
  {
    title: "Go live",
    body: "Send your logo and link. Your placement goes up and you can track it any time.",
  },
];

export function HowItWorksSection() {
  return (
    <div className="border-y border-line bg-panel">
      <Section>
        <SectionHeading
          eyebrow="How it works"
          title="Live in four steps"
          description="No sales calls and no negotiation on rates. Pick a slot, pay, send your creative."
        />
        <ol className="relative mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Connector rule behind the step numbers on wide screens. */}
          <div
            aria-hidden
            className="absolute left-[12%] right-[12%] top-[2.6rem] hidden border-t border-dashed border-line-strong lg:block"
          />
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative">
              <Card className="bmp-lift h-full bg-surface">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background ring-4 ring-surface">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
