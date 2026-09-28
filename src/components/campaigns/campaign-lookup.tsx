"use client";

import { useState } from "react";

import { Button, Card } from "@/components/ui";
import { CampaignResults } from "@/components/campaigns/campaign-results";
import type { LookupResult } from "@/components/campaigns/types";

/**
 * Advertiser campaign lookup.
 *
 * Requires reference + email together so a guessed reference alone cannot
 * reveal campaign data. This keeps the flow password-free but still gated.
 */
export function CampaignLookup({
  initialReference = "",
}: {
  initialReference?: string;
}) {
  const [reference, setReference] = useState(initialReference);
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/campaigns/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reference: reference.trim(),
          email: email.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Could not find that campaign.");
        setResult(null);
      } else {
        setResult(data as LookupResult);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSubmit}>
          <h2 className="text-base font-semibold">Find your campaign</h2>
          <p className="mt-1 text-sm text-muted">
            Enter the reference from your confirmation email and the email you
            booked with.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="reference"
                className="block text-sm font-medium text-foreground"
              >
                Booking reference
              </label>
              <input
                id="reference"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="BMP-7KQ2F4"
                required
                className="mt-2 w-full rounded-xl bg-panel px-4 py-2.5 font-mono text-sm uppercase ring-1 ring-line transition-shadow placeholder:font-sans placeholder:normal-case placeholder:text-muted/60 focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
                className="mt-2 w-full rounded-xl bg-panel px-4 py-2.5 text-sm ring-1 ring-line transition-shadow placeholder:text-muted/60 focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-danger/30 bg-danger-wash px-4 py-3 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" className="mt-5" disabled={loading}>
            {loading ? "Looking up…" : "View campaign"}
          </Button>
        </form>
      </Card>

      {result ? <CampaignResults result={result} /> : null}
    </div>
  );
}
