"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Card } from "@/components/ui";

/** Exchanges the admin token for an HttpOnly session cookie. */
export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Invalid token.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (!configured) {
    return (
      <Card>
        <h2 className="text-base font-semibold">Admin is not configured</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Set <code className="font-mono text-accent">ADMIN_TOKEN</code> in
          your environment to enable the creator console. Generate one with{" "}
          <code className="font-mono text-accent">openssl rand -hex 32</code>
          .
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <h2 className="text-base font-semibold">Creator sign in</h2>
        <p className="mt-1 text-sm text-muted">
          Enter your admin token to manage bookings.
        </p>

        <label htmlFor="token" className="mt-5 block text-sm font-medium">
          Admin token
        </label>
        <input
          id="token"
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          required
          autoComplete="current-password"
          className="mt-2 w-full rounded-xl bg-panel px-4 py-2.5 font-mono text-sm ring-1 ring-line transition-shadow focus:ring-2 focus:ring-accent"
        />

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-danger/30 bg-danger-wash px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}

        <Button type="submit" className="mt-5 w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}
