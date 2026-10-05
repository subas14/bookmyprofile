import type { ReactNode } from "react";

/** Numbered heading for each step of the booking form. */
export function StepHeader({
  step,
  title,
  description,
  aside,
}: {
  step: number;
  title: string;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground font-mono text-xs font-bold text-background"
      >
        {step}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold">
            <span className="sr-only">Step {step}: </span>
            {title}
          </h2>
          {aside}
        </div>
        {description ? (
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
