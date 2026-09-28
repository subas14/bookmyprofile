import { ButtonLink, Section } from "@/components/ui";

export default function NotFound() {
  return (
    <Section className="py-28 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
        404
      </p>
      <h1 className="mx-auto mt-4 max-w-xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
        That page isn&rsquo;t here.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted">
        The link may be out of date. The available placements and pricing are
        always on the home page.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Back to home</ButtonLink>
        <ButtonLink href="/book" variant="secondary">
          Book a placement
        </ButtonLink>
      </div>
    </Section>
  );
}
