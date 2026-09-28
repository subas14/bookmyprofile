/** Serializable props passed from the booking server page to the client form. */

export interface BookablePlacement {
  slotKey: string;
  kind: string;
  label: string;
  summary: string;
  details: string;
  priceMonthlyCents: number;
  minMonths: number;
  maxMonths: number;
  available: boolean;
  /** Free concurrent lines right now (the bio link holds several brands). */
  openCount?: number;
  maxConcurrent?: number;
  /** ISO date string of when a taken placement frees up. */
  nextAvailableFrom: string | null;
}

/** Mirrors `PricingQuote` from the pricing engine, over the wire. */
export interface QuoteResponse {
  lineItems: {
    slotKey: string;
    label: string;
    unitPriceCents: number;
    months: number;
    subtotalCents: number;
  }[];
  placementSubtotalCents: number;
  termDiscountBps: number;
  termDiscountCents: number;
  bundleDiscountBps: number;
  bundleDiscountCents: number;
  discountCents: number;
  promoListCents: number;
  promoDiscountCents: number;
  promoAddonCents: number;
  includesPromoPost: boolean;
  /** `0` means the two-week launch special. */
  months: number;
  isLaunchSpecial: boolean;
  totalCents: number;
  totalSavingsCents: number;
  listTotalCents: number;
}
