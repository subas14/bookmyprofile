import { Section } from "@/components/ui";

/**
 * Shared layout for policy pages, so terms / privacy / transparency all share
 * one consistent typographic treatment.
 */
export interface LegalBlock {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export function LegalPage({
  title,
  intro,
  updated,
  blocks,
}: {
  title: string;
  intro: string;
  updated: string;
  blocks: LegalBlock[];
}) {
  return (
    <>
      <div className="border-b border-line">
        <Section className="py-16">
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {intro}
          </p>
          <p className="mt-4 text-sm text-muted">Last updated: {updated}</p>
        </Section>
      </div>

      <Section className="py-16">
        <div className="mx-auto max-w-3xl space-y-10">
          {blocks.map((block) => (
            <section key={block.heading}>
              <h2 className="text-xl font-bold">
                {block.heading}
              </h2>
              {block.paragraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="mt-3 text-[15px] leading-relaxed text-muted"
                >
                  {paragraph}
                </p>
              ))}
              {block.bullets ? (
                <ul className="mt-4 space-y-2">
                  {block.bullets.map((bullet) => (
                    <li
                      key={bullet.slice(0, 40)}
                      className="flex gap-3 text-[15px] leading-relaxed text-muted"
                    >
                      <span
                        aria-hidden
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </Section>
    </>
  );
}
