"use client";

import { useEffect } from "react";

import { Button, ButtonLink, Section } from "@/components/ui";

/**
 * Route-level error boundary.
 *
 * The underlying error is logged rather than displayed, so internal details are
 * never leaked to an advertiser mid-checkout.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <Section className="py-28 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
        Something went wrong
      </p>
      <h1 className="mx-auto mt-4 max-w-xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
        We hit an unexpected error.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted">
        Nothing was charged. Try again, and if it keeps happening quote the
        reference below.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-muted">{error.digest}</p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <ButtonLink href="/" variant="secondary">
          Back to home
        </ButtonLink>
      </div>
    </Section>
  );
}
