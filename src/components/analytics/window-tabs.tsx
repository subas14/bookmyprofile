"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { cx } from "@/components/ui";

/**
 * Range selector for the analytics page (7D / 2W / 3M).
 *
 * The selection lives in the query string rather than component state so a
 * chosen window is shareable and survives a reload, and the page can keep
 * rendering its figures on the server.
 */
export function WindowTabs({
  windows,
  active,
}: {
  windows: readonly { periodDays: number; short: string; label: string }[];
  active: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function select(periodDays: number) {
    const next = new URLSearchParams(params.toString());
    next.set("window", String(periodDays));
    startTransition(() => {
      router.replace(`/analytics?${next.toString()}`, { scroll: false });
    });
  }

  return (
    <div
      role="tablist"
      aria-label="Analytics period"
      className={cx(
        "inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1",
        isPending && "opacity-70",
      )}
    >
      {windows.map((window) => {
        const selected = window.periodDays === active;
        return (
          <button
            key={window.periodDays}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => select(window.periodDays)}
            className={cx(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
              selected
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground",
            )}
          >
            <span aria-hidden>{window.short}</span>
            <span className="sr-only">Last {window.label}</span>
          </button>
        );
      })}
    </div>
  );
}
