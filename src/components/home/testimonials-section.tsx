import { Card, Section, SectionHeading } from "@/components/ui";
import type { TestimonialView } from "@/components/home/types";

export function TestimonialsSection({
  testimonials,
}: {
  testimonials: TestimonialView[];
}) {
  if (testimonials.length === 0) return null;

  return (
    <Section>
      <SectionHeading
        eyebrow="Advertisers"
        title="What brands say after booking"
      />
      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} className="bmp-lift flex flex-col">
            <span
              aria-hidden
              className="font-serif text-5xl leading-none text-accent/60"
            >
              &ldquo;
            </span>
            <blockquote className="-mt-3 flex-1 text-[15px] leading-relaxed text-foreground">
              {testimonial.quote}
            </blockquote>
            <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
              <span
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded-full bg-subtle-strong text-sm font-bold text-muted"
              >
                {testimonial.author.charAt(0)}
              </span>
              <div>
                <p className="text-sm font-semibold">{testimonial.author}</p>
                <p className="text-xs text-muted">{testimonial.role}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
