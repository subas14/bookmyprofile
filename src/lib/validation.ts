import { z } from "zod";

/**
 * Request validation schemas shared by the API routes and the booking UI.
 */

/** Rejects non-http(s) URLs (e.g. `javascript:`) that could be rendered later. */
const httpUrl = z
  .string()
  .trim()
  .url("Must be a valid URL")
  .refine(
    (value) => /^https?:\/\//i.test(value),
    "URL must start with http:// or https://",
  )
  .refine((value) => value.length <= 2048, "URL is too long");

export const bookingRequestSchema = z.object({
  creatorSlug: z.string().trim().min(1).max(64),
  /** One or more placement slot keys, e.g. ["cover-left", "bio-link"]. */
  slotKeys: z
    .array(z.string().trim().min(1).max(64))
    .min(1, "Select at least one placement")
    .max(8, "Too many placements selected"),
  /** Whole months (1–12), or `0` for the two-week launch special. */
  months: z
    .number({ invalid_type_error: "Months must be a number" })
    .int("Months must be a whole number")
    .min(0, "Choose a valid term")
    .max(12, "Maximum term is 12 months"),
  /** `YYYY-MM-DD`. Defaults to the next available date when omitted. */
  startDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD")
    .optional(),
  includePromoPost: z.boolean().default(false),

  advertiserName: z.string().trim().min(2, "Name is required").max(120),
  advertiserEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .max(200),
  brandName: z.string().trim().min(1, "Brand name is required").max(120),
  targetUrl: httpUrl,
  assetUrl: httpUrl.optional().or(z.literal("")).transform((v) => v || undefined),
  notes: z.string().trim().max(2000).optional(),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

export const availabilityQuerySchema = z.object({
  creatorSlug: z.string().trim().min(1).max(64),
  months: z.coerce.number().int().min(0).max(12).default(1),
  startDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const quoteRequestSchema = z.object({
  creatorSlug: z.string().trim().min(1).max(64),
  slotKeys: z.array(z.string().trim().min(1).max(64)).max(8),
  months: z.coerce.number().int().min(0).max(12),
  includePromoPost: z.boolean().default(false),
});

/** Self-custodial crypto payment verification request. */
export const cryptoVerifySchema = z.object({
  reference: z.string().trim().min(4).max(32),
  chain: z.enum(["solana", "ethereum", "base", "arbitrum"]),
  asset: z.enum(["USDC", "USDT"]),
  /** Solana signature (base58) or EVM tx hash (0x…); verified again server-side. */
  txHash: z.string().trim().min(43).max(90),
});

/** Advertiser campaign lookup: reference + email must both match. */
export const campaignLookupSchema = z.object({
  reference: z.string().trim().min(4).max(32),
  email: z.string().trim().toLowerCase().email(),
});

/** Creator moderation action on a booking. */
export const bookingDecisionSchema = z.object({
  bookingId: z.string().trim().min(1),
  action: z.enum(["approve", "reject", "activate", "complete", "cancel"]),
  reason: z.string().trim().max(500).optional(),
});

/** Formats a ZodError into a field -> message map for API responses. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
