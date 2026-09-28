import { z } from "zod";

/**
 * Server-side environment contract.
 *
 * Validation is lazy (on first access) rather than at module load so that
 * `next build` can prerender pages without every secret being present. Anything
 * that actually needs a secret calls `serverEnv()` and fails loudly at runtime.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DODO_PAYMENTS_API_KEY: z.string().default(""),
  DODO_PAYMENTS_ENVIRONMENT: z
    .enum(["test_mode", "live_mode"])
    .default("test_mode"),
  DODO_PAYMENTS_WEBHOOK_SECRET: z.string().default(""),
  DODO_PAYMENTS_PRODUCT_ID: z.string().default(""),
  ADMIN_TOKEN: z.string().default(""),

  // ---- Self-custodial crypto (USDC / USDT) ----
  // Public receiving addresses. Leaving one blank disables that chain.
  CRYPTO_SOLANA_ADDRESS: z.string().default(""),
  CRYPTO_EVM_ADDRESS: z.string().default(""),
  // Comma-separated EVM chains to accept, e.g. "ethereum,base,arbitrum".
  CRYPTO_EVM_CHAINS: z.string().default(""),
  // RPC endpoints. Public defaults are used when these are blank, but they
  // rate-limit; point at Helius / Alchemy / Infura for production.
  CRYPTO_SOLANA_RPC_URL: z.string().default(""),
  CRYPTO_ETHEREUM_RPC_URL: z.string().default(""),
  CRYPTO_BASE_RPC_URL: z.string().default(""),
  CRYPTO_ARBITRUM_RPC_URL: z.string().default(""),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DODO_PAYMENTS_API_KEY: process.env.DODO_PAYMENTS_API_KEY,
    DODO_PAYMENTS_ENVIRONMENT: process.env.DODO_PAYMENTS_ENVIRONMENT,
    DODO_PAYMENTS_WEBHOOK_SECRET: process.env.DODO_PAYMENTS_WEBHOOK_SECRET,
    DODO_PAYMENTS_PRODUCT_ID: process.env.DODO_PAYMENTS_PRODUCT_ID,
    ADMIN_TOKEN: process.env.ADMIN_TOKEN,
    CRYPTO_SOLANA_ADDRESS: process.env.CRYPTO_SOLANA_ADDRESS,
    CRYPTO_EVM_ADDRESS: process.env.CRYPTO_EVM_ADDRESS,
    CRYPTO_EVM_CHAINS: process.env.CRYPTO_EVM_CHAINS,
    CRYPTO_SOLANA_RPC_URL: process.env.CRYPTO_SOLANA_RPC_URL,
    CRYPTO_ETHEREUM_RPC_URL: process.env.CRYPTO_ETHEREUM_RPC_URL,
    CRYPTO_BASE_RPC_URL: process.env.CRYPTO_BASE_RPC_URL,
    CRYPTO_ARBITRUM_RPC_URL: process.env.CRYPTO_ARBITRUM_RPC_URL,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid server environment:\n${issues}`);
  }

  cached = parsed.data;
  return cached;
}

/** True when Dodo Payments is fully configured and live checkout can be created. */
export function isPaymentsConfigured(): boolean {
  const env = serverEnv();
  return Boolean(env.DODO_PAYMENTS_API_KEY && env.DODO_PAYMENTS_PRODUCT_ID);
}

/** Public app URL without a trailing slash. */
export function appUrl(): string {
  return serverEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}

/** Slug of the creator featured across the marketing site. */
export const PRIMARY_CREATOR_SLUG =
  process.env.NEXT_PUBLIC_PRIMARY_CREATOR_SLUG || "shub0414";
