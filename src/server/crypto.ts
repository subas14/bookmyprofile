import {
  type CryptoAsset,
  type CryptoChain,
  UNDERPAYMENT_TOLERANCE_UNITS,
  chainConfig,
  receivingAddressFor,
  requiredBaseUnits,
  rpcUrlFor,
  tokenAddress,
} from "@/lib/crypto-config";

/**
 * On-chain verification for self-custodial USDC / USDT settlement.
 *
 * The advertiser sends a stablecoin transfer to our published address and gives
 * us the transaction hash. This module independently re-derives the truth from
 * the chain — it never trusts the client's claim about amount, asset or
 * recipient. A payment is accepted only when ALL of these hold for the tx:
 *
 *   1. it exists and is finalised/successful,
 *   2. it transferred the expected token contract/mint (not a look-alike),
 *   3. it credited OUR configured receiving address,
 *   4. the credited amount is at least the amount due (minus a 1c tolerance).
 *
 * Idempotency (a tx hash settling only one booking) is enforced by the unique
 * `cryptoTxHash` column plus the idempotent `markOrderPaid`, not here.
 *
 * Dependency-free by design: raw JSON-RPC over `fetch`, matching the rest of
 * the codebase, so no wallet SDKs are pulled in.
 */

export interface VerifyInput {
  chain: CryptoChain;
  asset: CryptoAsset;
  txHash: string;
  /** Total due for the order, in USD cents. */
  amountCents: number;
}

export type VerifyResult =
  | {
      ok: true;
      /** Amount actually received, in the token's smallest unit. */
      amountRaw: bigint;
      normalizedTxHash: string;
    }
  | { ok: false; reason: string };

/** Minimal JSON-RPC caller shared by the EVM verifiers. */
async function rpc<T>(
  url: string,
  method: string,
  params: unknown[],
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    // Never cache chain reads.
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`RPC ${method} HTTP ${response.status}`);
  }
  const json = (await response.json()) as {
    result?: T;
    error?: { message?: string };
  };
  if (json.error) {
    throw new Error(`RPC ${method} error: ${json.error.message ?? "unknown"}`);
  }
  return json.result as T;
}

/** ERC-20 `Transfer(address,address,uint256)` topic hash. */
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

/** Lower-cases and left-pads an address to a 32-byte topic for comparison. */
function addressTopic(address: string): string {
  const clean = address.toLowerCase().replace(/^0x/, "");
  return "0x" + clean.padStart(64, "0");
}

interface EvmLog {
  address: string;
  topics: string[];
  data: string;
}

interface EvmReceipt {
  status: string;
  logs: EvmLog[];
}

/**
 * Verifies an ERC-20 stablecoin transfer on an EVM chain.
 *
 * Reads the transaction receipt and scans its logs for a `Transfer` emitted by
 * the expected token contract, addressed to our receiving wallet, summing all
 * matching transfers in case a router split the payment.
 */
async function verifyEvm(input: VerifyInput): Promise<VerifyResult> {
  const cfg = chainConfig(input.chain);
  if (cfg.kind !== "evm") return { ok: false, reason: "Not an EVM chain" };

  const txHash = input.txHash.trim().toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(txHash)) {
    return { ok: false, reason: "That does not look like an EVM transaction hash." };
  }

  const token = tokenAddress(input.chain, input.asset);
  const recipient = receivingAddressFor(input.chain);
  if (!token || !recipient) {
    return { ok: false, reason: "This chain or asset is not configured." };
  }

  const url = rpcUrlFor(input.chain);
  const receipt = await rpc<EvmReceipt | null>(
    url,
    "eth_getTransactionReceipt",
    [txHash],
  );

  if (!receipt) {
    return {
      ok: false,
      reason: "Transaction not found yet. Wait for it to confirm, then retry.",
    };
  }
  // status is "0x1" on success, "0x0" on revert.
  if (receipt.status !== "0x1") {
    return { ok: false, reason: "That transaction failed on-chain." };
  }

  const wantRecipient = addressTopic(recipient);
  let received = BigInt(0);

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== token) continue;
    if (log.topics[0] !== TRANSFER_TOPIC) continue;
    // topics: [sig, from, to]; data: amount (uint256).
    if (log.topics.length < 3) continue;
    if (log.topics[2].toLowerCase() !== wantRecipient) continue;
    received += BigInt(log.data);
  }

  if (received === BigInt(0)) {
    return {
      ok: false,
      reason:
        `No ${input.asset} transfer to our ${cfg.label} address was found in ` +
        "that transaction. Check the network and token.",
    };
  }

  const required = requiredBaseUnits(input.amountCents);
  if (received + UNDERPAYMENT_TOLERANCE_UNITS < required) {
    return {
      ok: false,
      reason: "The amount received is less than the amount due.",
    };
  }

  return { ok: true, amountRaw: received, normalizedTxHash: txHash };
}

// ---- Solana ---------------------------------------------------------------

interface SolTokenBalance {
  accountIndex: number;
  mint: string;
  owner?: string;
  uiTokenAmount: { amount: string; decimals: number };
}

interface SolTransaction {
  meta: {
    err: unknown;
    preTokenBalances?: SolTokenBalance[];
    postTokenBalances?: SolTokenBalance[];
  } | null;
}

/**
 * Verifies an SPL stablecoin transfer on Solana.
 *
 * A bare SPL transfer carries no invoice reference, so correctness is derived
 * from token-balance deltas: we find the token account owned by OUR wallet for
 * the expected mint and require its balance to have risen by at least the
 * amount due. This is robust to the transfer instruction shape used.
 */
async function verifySolana(input: VerifyInput): Promise<VerifyResult> {
  const signature = input.txHash.trim();
  // base58, no 0/O/I/l; signatures are ~87-88 chars.
  if (!/^[1-9A-HJ-NP-Za-km-z]{43,90}$/.test(signature)) {
    return { ok: false, reason: "That does not look like a Solana signature." };
  }

  const mint = tokenAddress("solana", input.asset);
  const owner = receivingAddressFor("solana");
  if (!mint || !owner) {
    return { ok: false, reason: "Solana or this asset is not configured." };
  }

  const url = rpcUrlFor("solana");
  const tx = await rpc<SolTransaction | null>(url, "getTransaction", [
    signature,
    { encoding: "json", commitment: "finalized", maxSupportedTransactionVersion: 0 },
  ]);

  if (!tx || !tx.meta) {
    return {
      ok: false,
      reason: "Transaction not found or not finalised yet. Retry shortly.",
    };
  }
  if (tx.meta.err) {
    return { ok: false, reason: "That transaction failed on-chain." };
  }

  const matches = (b: SolTokenBalance) => b.mint === mint && b.owner === owner;
  const sumFor = (list: SolTokenBalance[] | undefined) =>
    (list ?? [])
      .filter(matches)
      .reduce((total, b) => total + BigInt(b.uiTokenAmount.amount), BigInt(0));

  const credited = sumFor(tx.meta.postTokenBalances) - sumFor(tx.meta.preTokenBalances);

  if (credited <= BigInt(0)) {
    return {
      ok: false,
      reason:
        `No ${input.asset} was credited to our Solana address in that ` +
        "transaction. Check the token and destination.",
    };
  }

  const required = requiredBaseUnits(input.amountCents);
  if (credited + UNDERPAYMENT_TOLERANCE_UNITS < required) {
    return {
      ok: false,
      reason: "The amount received is less than the amount due.",
    };
  }

  return { ok: true, amountRaw: credited, normalizedTxHash: signature };
}

/**
 * Public entry point: verifies a claimed payment for the given chain/asset.
 *
 * Network/RPC failures are surfaced as a friendly, retryable reason rather than
 * throwing, so a flaky RPC never looks like a rejected payment.
 */
export async function verifyPayment(input: VerifyInput): Promise<VerifyResult> {
  try {
    return input.chain === "solana"
      ? await verifySolana(input)
      : await verifyEvm(input);
  } catch (error) {
    console.error("[crypto] verification error", error);
    return {
      ok: false,
      reason:
        "We could not reach the network to verify that transaction. Please " +
        "try again in a moment.",
    };
  }
}
