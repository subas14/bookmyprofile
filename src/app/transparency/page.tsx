import type { Metadata } from "next";

import { LegalPage, type LegalBlock } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Transparency",
  description:
    "How BookMyProfile reports audience figures, what is guaranteed, what is " +
    "not, and how advertisers can verify every claim.",
};

const BLOCKS: LegalBlock[] = [
  {
    heading: "Why this page exists",
    paragraphs: [
      "Creator advertising has an honesty problem. Reach is quoted as all-time totals, screenshots are cropped, and engagement is inflated with bought followers. This page states exactly what is measured, what is estimated, and what is promised.",
    ],
  },
  {
    heading: "Where the numbers come from",
    paragraphs: [
      "Impressions, profile visits, engagements, link clicks and follower counts are taken from the native X Analytics dashboard for the specific rolling window shown next to each figure.",
    ],
    bullets: [
      "Every figure is tied to a start and end date, never presented as an all-time total.",
      "Windows are rolling (30 and 90 days) and are refreshed rather than cherry-picked.",
      "Audience composition (location, role, interest and device splits) is modelled from the audience data X exposes and is labelled as a share, not a headcount.",
      "Nothing is sourced from third-party estimation tools.",
    ],
  },
  {
    heading: "What is guaranteed",
    paragraphs: [
      "The guarantee is about placement, not performance, because placement is the only part that is fully within anyone's control.",
    ],
    bullets: [
      "Your placement is exclusive for the entire term you paid for.",
      "No rotation, no sharing a slot, and no direct competitor in an adjacent slot.",
      "If a placement fails to run for reasons on the creator's side, the affected period is refunded pro-rata.",
      "If a booking is declined during review, it is refunded in full and the slot released.",
    ],
  },
  {
    heading: "What is not guaranteed",
    paragraphs: [
      "No specific number of clicks, signups, or conversions is promised. Audience reach varies week to week, and how well a placement converts depends heavily on your product, your landing page, and your offer.",
      "Historical reach is published openly precisely so you can form your own expectations rather than relying on a promise.",
    ],
  },
  {
    heading: "How to verify independently",
    paragraphs: [
      "The profile is public. Post frequency, replies, and who engages can all be inspected without asking permission. Compare what you see against the analytics page.",
      "If any figure looks wrong, say so. Demonstrable errors are corrected on the page rather than quietly adjusted.",
    ],
  },
  {
    heading: "Advertiser standards",
    paragraphs: [
      "Not every booking is accepted. Bookings that are misleading, adult, hateful, or in a directly competing category to an existing advertiser may be declined and refunded in full.",
      "This protects both the audience and the advertisers already paying for exclusivity.",
    ],
  },
  {
    heading: "Payments and data",
    paragraphs: [
      "Payments are processed by Dodo Payments as merchant of record. Card and wallet details are never seen or stored by BookMyProfile.",
      "The only advertiser data stored is what is needed to run and support a campaign: name, email, brand, destination URL, creative, and the booking record itself.",
    ],
  },
];

export default function TransparencyPage() {
  return (
    <LegalPage
      title="Transparency"
      intro="Everything an advertiser should be able to check before spending money, including the parts that are less flattering."
      updated="19 September 2026"
      blocks={BLOCKS}
    />
  );
}
