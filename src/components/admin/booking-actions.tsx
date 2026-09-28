"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui";
import type { BookingStatus } from "@/lib/domain";

/**
 * Moderation controls for a single booking.
 *
 * Only actions that are legal from the current status are offered; the server
 * re-validates the transition regardless of what is sent.
 */
const ACTIONS_BY_STATUS: Record<
  string,
  { action: string; label: string; variant: "primary" | "secondary" }[]
> = {
  PENDING_PAYMENT: [
    { action: "cancel", label: "Cancel", variant: "secondary" },
  ],
  AWAITING_REVIEW: [
    { action: "approve", label: "Approve", variant: "primary" },
    { action: "reject", label: "Reject", variant: "secondary" },
  ],
  SCHEDULED: [
    { action: "activate", label: "Set live", variant: "primary" },
    { action: "cancel", label: "Cancel", variant: "secondary" },
  ],
  LIVE: [
    { action: "complete", label: "Mark complete", variant: "primary" },
    { action: "cancel", label: "Cancel", variant: "secondary" },
  ],
};

export function BookingActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus | string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = ACTIONS_BY_STATUS[status] ?? [];
  if (actions.length === 0) {
    return <p className="text-xs text-muted">No actions available.</p>;
  }

  async function run(action: string) {
    setPending(action);
    setError(null);
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bookingId, action }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(data.message ?? data.error ?? "Action failed.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {actions.map((item) => (
          <Button
            key={item.action}
            type="button"
            size="sm"
            variant={item.variant}
            disabled={pending !== null}
            onClick={() => run(item.action)}
          >
            {pending === item.action ? "Working…" : item.label}
          </Button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
