import { serverEnv } from "@/lib/env";

/**
 * Static configuration for self-custodial stablecoin settlement.
 *
 * The app accepts USDC / USDT paid directly to a wallet the creator controls.
 * There is no third-party processor: an advertiser sends the transfer and pastes
 * the transaction hash, and the server independently verifies it on-chain (see
 * `src/server/crypto.ts`). This module holds the immutable facts — token
 * contracts, mints, decimals, chain metadata — and derives which chains are
 * actually enabled from the environment.
 *
 * SECURITY: token contract addresses and mints are hard-coded here on purpose.
 * They are the anchor the verifier checks against; if they came from user input
 * an attacker could point us at a worthless look-alike token.
 */

/** Supported stablecoins. Both are 6-decimal tokens on every chain we support. */
export type CryptoAsset = "USDC" | "USDT";

/** Supported settlement chains. */
export type CryptoChain = "solana" | "ethereum" | "base" | "arbitrum";

/** USDC and USDT both use 6 decimals on all supported chains. */
export const STABLECOIN_DECIMALS = 6;

export interface EvmChainConfig {
  kind: "evm";
  chain: CryptoChain;
  label: string;
  /** EIP-155 chain id, used to sanity-check RPC responses. */
  chainId: number;
  /** Lower-cased ERC-20 contract per asset. */
  tokens: Record<CryptoAsset, string>;
  /** Default public RPC when no env override is supplied. */
  defaultRpcUrl: string;
  /** Human note about gas, shown in the UI. */
  gasNote: string;
}

export interface SolanaChainConfig {
  kind: "solana";
  chain: "solana";
  label: string;
  /** SPL mint address per asset. */
  tokens: Record<CryptoAsset, string>;
  defaultRpcUrl: string;
  gasNote: string;
}

export type ChainConfig = EvmChainConfig | SolanaChainConfig;

/**
 * Canonical token registry. Addresses are the widely-published canonical
 * deployments; keep EVM entries lower-cased for case-insensitive comparison.
 */
const SOLANA: SolanaChainConfig = {
  kind: "solana",
  chain: "solana",
  label: "Solana",
  tokens: {
    USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    USDT: "Es9vMFrzaCERmJfrF4H2FYD4KConky11McbmiZmFZP1v",
  },
  defaultRpcUrl: "https://api.mainnet-beta.solana.com",
  gasNote: "Network fees are a fraction of a cent.",
};

const ETHEREUM: EvmChainConfig = {
  kind: "evm",
  chain: "ethereum",
  label: "Ethereum",
  chainId: 1,
  tokens: {
    USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  },
  defaultRpcUrl: "https://eth.llamarpc.com",
  gasNote: "Ethereum mainnet gas can be several dollars — an L2 is cheaper.",
};

const BASE: EvmChainConfig = {
  kind: "evm",
  chain: "base",
  label: "Base",
  chainId: 8453,
  tokens: {
    USDC: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    USDT: "0xfde4c96c8593536e31f229ea8f37b2ada2699bb2",
  },
  defaultRpcUrl: "https://mainnet.base.org",
  gasNote: "Fees are typically a few cents.",
};

const ARBITRUM: EvmChainConfig = {
  kind: "evm",
  chain: "arbitrum",
  label: "Arbitrum One",
  chainId: 42161,
  tokens: {
    USDC: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    USDT: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
  },
  defaultRpcUrl: "https://arb1.arbitrum.io/rpc",
  gasNote: "Fees are typically a few cents.",
};

const ALL_CHAINS: Record<CryptoChain, ChainConfig> = {
  solana: SOLANA,
  ethereum: ETHEREUM,
  base: BASE,
  arbitrum: ARBITRUM,
};

/** RPC override env var name per chain. */
const RPC_ENV_KEY: Record<CryptoChain, keyof ReturnType<typeof serverEnv>> = {
  solana: "CRYPTO_SOLANA_RPC_URL",
  ethereum: "CRYPTO_ETHEREUM_RPC_URL",
  base: "CRYPTO_BASE_RPC_URL",
  arbitrum: "CRYPTO_ARBITRUM_RPC_URL",
};

/** Resolves the RPC URL for a chain, preferring the env override. */
export function rpcUrlFor(chain: CryptoChain): string {
  const override = serverEnv()[RPC_ENV_KEY[chain]];
  return (typeof override === "string" && override) || ALL_CHAINS[chain].defaultRpcUrl;
}

/** The public receiving address for a chain (Solana base58 or EVM 0x). */
export function receivingAddressFor(chain: CryptoChain): string {
  const env = serverEnv();
  return chain === "solana" ? env.CRYPTO_SOLANA_ADDRESS : env.CRYPTO_EVM_ADDRESS;
}

/**
 * Which chains are live right now: an address must be set, and EVM chains must
 * additionally be named in CRYPTO_EVM_CHAINS.
 */
export function enabledChains(): CryptoChain[] {
  const env = serverEnv();
  const out: CryptoChain[] = [];

  if (env.CRYPTO_SOLANA_ADDRESS) out.push("solana");

  if (env.CRYPTO_EVM_ADDRESS) {
    const named = env.CRYPTO_EVM_CHAINS.split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    for (const name of named) {
      if (name === "ethereum" || name === "base" || name === "arbitrum") {
        if (!out.includes(name)) out.push(name);
      }
    }
  }

  return out;
}

/** True when at least one crypto chain is configured for settlement. */
export function isCryptoConfigured(): boolean {
  return enabledChains().length > 0;
}

export function chainConfig(chain: CryptoChain): ChainConfig {
  return ALL_CHAINS[chain];
}

/** Contract/mint for a given chain + asset, or null if unsupported. */
export function tokenAddress(
  chain: CryptoChain,
  asset: CryptoAsset,
): string | null {
  return ALL_CHAINS[chain].tokens[asset] ?? null;
}

/**
 * Required amount in the token's smallest unit for a USD-cent total.
 *
 * USDC/USDT track $1 and use 6 decimals, so $1.00 = 1_000_000 units and one
 * cent = 10_000 units. Example: 8900 cents ($89) -> 89_000_000 units.
 */
export function requiredBaseUnits(amountCents: number): bigint {
  return BigInt(amountCents) * BigInt(10000);
}

/**
 * Underpayment tolerance in base units. Wallets and bridges can shave a hair
 * off via rounding, so accept a 1-cent (10_000-unit) shortfall rather than
 * rejecting an otherwise-correct payment.
 */
export const UNDERPAYMENT_TOLERANCE_UNITS = BigInt(10000);

/** Public-safe view of an enabled chain for the checkout UI. */
export interface PublicChainOption {
  chain: CryptoChain;
  label: string;
  address: string;
  assets: CryptoAsset[];
  gasNote: string;
}

/** Builds the list of chain options to render, with addresses, for the client. */
export function publicChainOptions(): PublicChainOption[] {
  return enabledChains().map((chain) => {
    const cfg = ALL_CHAINS[chain];
    return {
      chain,
      label: cfg.label,
      address: receivingAddressFor(chain),
      assets: Object.keys(cfg.tokens) as CryptoAsset[],
      gasNote: cfg.gasNote,
    };
  });
}
