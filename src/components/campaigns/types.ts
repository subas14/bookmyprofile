/** Wire shapes returned by POST /api/campaigns/lookup. */

export interface CampaignMetricView {
  date: string;
  impressions: number;
  clicks: number;
  profileVisits: number;
}

export interface CampaignView {
  id: string;
  status: string;
  placement: { label: string; kind: string; slotKey: string };
  brandName: string;
  targetUrl: string;
  months: number;
  startDate: string;
  endDate: string;
  totalAmountCents: number;
  includesPromoPost: boolean;
  paidAt: string | null;
  metrics: CampaignMetricView[];
  events: { type: string; message: string; createdAt: string }[];
}

export interface LookupResult {
  reference: string;
  creator: { displayName: string; handle: string; profileUrl: string };
  totalAmountCents: number;
  campaigns: CampaignView[];
}
