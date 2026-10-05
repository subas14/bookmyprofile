import { Section, SectionHeading } from "@/components/ui";

const STEPS = [
  {
    title: "Choose a placement",
    body: "A product link in the bio, either half of the cover, or a bundle. Pick a term from two weeks to twelve months.",
  },
  {
    title: "Book & pay securely",
    body: "Checkout is handled by Dodo Payments, merchant of record. Card, wallet or crypto, with an invoice by email.",
  },
  {
    title: "Creator reviews",
    body: "Your booking and creative are reviewed. If it is declined, you are refunded in full.",
  },
  {
    title: "Campaign goes live",
    body: "The placement goes up on your start date. Track its status any time with your reference.",
  },
];

export function HowItWorksSection() {
  return (
    <Section className="py-16 sm:py-20">
      <SectionHeading
        align="left"
        eyebrow="How it works"
        title="From booking to live in four steps."
        description="No sales calls and no negotiation on rates."
      />
      <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="bg-surface p-5 sm:p-6">
            <span className="font-mono text-sm font-semibold tabular-nums text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
