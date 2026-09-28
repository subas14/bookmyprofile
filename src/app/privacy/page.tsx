import type { Metadata } from "next";

import { LegalPage, type LegalBlock } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What data BookMyProfile collects, why it is collected, who it is shared " +
    "with, how long it is kept, and your rights over it.",
};

const BLOCKS: LegalBlock[] = [
  {
    heading: "Summary",
    paragraphs: [
      "Only the data needed to sell, run and support an advertising placement is collected. Payment card details are never seen or stored by BookMyProfile. Nothing is sold to third parties, and there is no advertising or tracking network embedded in this site.",
    ],
  },
  {
    heading: "What is collected",
    paragraphs: [
      "When you book a placement, the following is collected and stored:",
    ],
    bullets: [
      "Your name and email address, used for your invoice and campaign correspondence.",
      "Your brand name, destination URL and any creative asset URL you supply.",
      "Any notes you choose to add to the booking.",
      "The booking record: placements, term dates, amounts, discounts and status history.",
      "Payment identifiers returned by Dodo Payments, so a payment can be reconciled with a booking.",
    ],
  },
  {
    heading: "What is not collected",
    paragraphs: [
      "Card numbers, bank details and wallet credentials are handled entirely by Dodo Payments and never reach our servers.",
      "There are no third-party advertising trackers, session recorders, or cross-site pixels on this site.",
    ],
  },
  {
    heading: "Why it is collected",
    paragraphs: [
      "The lawful basis is performance of a contract: this information is necessary to deliver the placement you purchased, issue your invoice, and support you during the campaign.",
      "A limited record is also retained to satisfy tax and accounting obligations.",
    ],
  },
  {
    heading: "Who it is shared with",
    paragraphs: ["Data is shared only where it is necessary to operate:"],
    bullets: [
      "Dodo Payments: payment processing and invoicing, as merchant of record.",
      "Our hosting and database providers, who store the data on our behalf.",
      "Tax and accounting authorities where legally required.",
    ],
  },
  {
    heading: "How long it is kept",
    paragraphs: [
      "Booking and invoice records are kept for as long as required by tax law, typically seven years.",
      "Free-text notes and creative asset references are deleted on request once a campaign has ended.",
    ],
  },
  {
    heading: "Your rights",
    paragraphs: [
      "You may request a copy of the data held about you, ask for corrections, or ask for deletion of anything not required for legal record-keeping.",
      "Requests are actioned within 30 days. Contact the creator through the profile linked on this site.",
    ],
  },
  {
    heading: "Cookies",
    paragraphs: [
      "No analytics or advertising cookies are used. A single HttpOnly session cookie is set only when the creator signs in to the admin console. Advertisers browsing or booking do not receive tracking cookies.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro="What is collected, why, who it is shared with, and how to have it removed."
      updated="19 September 2026"
      blocks={BLOCKS}
    />
  );
}
