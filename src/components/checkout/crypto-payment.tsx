"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui";
import { formatMoney } from "@/lib/format";
import type { CryptoAsset, PublicChainOption } from "@/lib/crypto-config";

/**
 * Self-custodial crypto payment panel.
 *
 * Shows the receiving address and exact amount for the advertiser's chosen
 * chain + stablecoin, then lets them paste the transaction hash. Submitting
 * calls the verify API, which re-checks the transfer on-chain before settling —
 * the client is purely a convenience layer and is never trusted for amounts.
 */

const STATUS = {
  idle: "idle",
  verifying: "verifying",
  settled: "settled",
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS];

export function CryptoPayment({
  reference,
  amountCents,
  chains,
}: {
  reference: string;
  amountCents: number;
  chains: PublicChainOption[];
}) {
  const [chainKey, setChainKey] = useState(chains[0]?.chain ?? "solana");
  const active = useMemo(
    () => chains.find((c) => c.chain === chainKey) ?? chains[0],
    [chains, chainKey],
  );
  const [asset, setAsset] = useState<CryptoAsset>(active?.assets[0] ?? "USDC");
  const [txHash, setTxHash] = useState("");
  const [status, setStatus] = useState<Status>(STATUS.idle);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"address" | "amount" | null>(null);

  const amountLabel = formatMoney(amountCents);

  if (!active) return null;

  async function copy(text: string, which: "address" | "amount") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard may be blocked; the value is visible to copy manually.
    }
  }

  async function submit() {
    setError(null);
    setStatus(STATUS.verifying);
    try {
      const response = await fetch("/api/payments/crypto/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reference,
          chain: active!.chain,
          asset,
          txHash: txHash.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "We could not verify that transaction.");
        setStatus(STATUS.idle);
        return;
      }
      setStatus(STATUS.settled);
      // Refresh so the receipt above flips to the paid state.
      setTimeout(() => window.location.reload(), 900);
    } catch {
      setError("Network error. Please try again.");
      setStatus(STATUS.idle);
    }
  }

  if (status === STATUS.settled) {
    return (
      <div className="mt-6 rounded-2xl border border-success/30 bg-success-wash p-6 text-center">
        <p className="text-sm font-semibold text-success">
          Payment verified on-chain. Confirming your booking…
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
      <h2 className="text-base font-semibold">Pay with crypto (USDC / USDT)</h2>
      <p className="mt-1 text-sm text-muted">
        Send exactly {amountLabel} to the address below, then paste your
        transaction hash to confirm. Payment is verified directly on-chain.
      </p>

      {/* Chain selector */}
      <div className="mt-5">
        <span className="text-xs font-semibold text-muted">Network</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {chains.map((c) => (
            <button
              key={c.chain}
              type="button"
              onClick={() => {
                setChainKey(c.chain);
                setAsset(c.assets[0]);
                setError(null);
              }}
              className={
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors " +
                (c.chain === active.chain
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-line bg-panel text-muted hover:text-foreground")
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Asset selector */}
      <div className="mt-4">
        <span className="text-xs font-semibold text-muted">Stablecoin</span>
        <div className="mt-2 flex gap-2">
          {active.assets.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => {
                setAsset(a);
                setError(null);
              }}
              className={
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors " +
                (a === asset
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-line bg-panel text-muted hover:text-foreground")
              }
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Amount + address */}
      <dl className="mt-5 space-y-3">
        <div className="rounded-xl border border-line bg-panel p-3">
          <dt className="text-xs font-semibold text-muted">Amount</dt>
          <dd className="mt-1 flex items-center justify-between gap-3">
            <span className="font-mono text-sm">
              {amountLabel} in {asset}
            </span>
            <button
              type="button"
              onClick={() => copy((amountCents / 100).toString(), "amount")}
              className="shrink-0 text-xs font-semibold text-accent hover:text-foreground"
            >
              {copied === "amount" ? "Copied" : "Copy"}
            </button>
          </dd>
        </div>
        <div className="rounded-xl border border-line bg-panel p-3">
          <dt className="text-xs font-semibold text-muted">
            {active.label} address
          </dt>
          <dd className="mt-1 flex items-center justify-between gap-3">
            <span className="break-all font-mono text-xs">{active.address}</span>
            <button
              type="button"
              onClick={() => copy(active.address, "address")}
              className="shrink-0 text-xs font-semibold text-accent hover:text-foreground"
            >
              {copied === "address" ? "Copied" : "Copy"}
            </button>
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-xs leading-relaxed text-warning">
        Send only {asset} on {active.label}. Sending a different token or network
        will be lost. {active.gasNote}
      </p>

      {/* Tx hash */}
      <label className="mt-5 block">
        <span className="text-xs font-semibold text-muted">
          Transaction hash / signature
        </span>
        <input
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder={active.chain === "solana" ? "e.g. 5Uxs…" : "e.g. 0x…"}
          className="mt-2 w-full rounded-xl border border-line bg-panel px-3.5 py-2.5 font-mono text-xs outline-none focus:border-accent"
        />
      </label>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-danger/30 bg-danger-wash px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        size="lg"
        className="mt-5 w-full"
        disabled={status === STATUS.verifying || txHash.trim().length < 43}
        onClick={submit}
      >
        {status === STATUS.verifying
          ? "Verifying on-chain…"
          : "I've paid — verify payment"}
      </Button>
    </div>
  );
}
