import type { Metadata } from "next";

import { LegalPage, type LegalBlock } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms governing placement bookings on BookMyProfile: scope, payment, " +
    "delivery, creative standards, refunds and liability.",
};

const BLOCKS: LegalBlock[] = [
  {
    heading: "1. Overview",
    paragraphs: [
      "BookMyProfile (\"the Platform\") lets advertisers book advertising placements on a creator's social media profile for a defined period. By completing a booking you agree to these terms.",
      "These terms are written to be readable. Where a plain-English summary and a legal reading diverge, the plain reading is what will be honoured in practice.",
    ],
  },
  {
    heading: "2. What a booking includes",
    paragraphs: [
      "A booking grants a non-exclusive, non-transferable right to have your brand asset and destination URL displayed in a specified placement on the creator's profile for the term you purchased.",
    ],
    bullets: [
      "Placements are single-occupancy: while your term runs, no other advertiser occupies that placement. The bio-link placement holds up to three concurrent product links, each belonging to one advertiser.",
      "Cover-photo placements display your creative in a fixed half (left or right) of the cover image.",
      "The bio-link placement lists your destination URL, with a short line of copy, in the profile bio.",
      "A promotional post add-on, where purchased, is published once and retained indefinitely.",
    ],
  },
  {
    heading: "3. Payment",
    paragraphs: [
      "Prices are shown in US dollars and charged as a single up-front payment covering the full term. Payments are processed by Dodo Payments, which acts as merchant of record and issues your invoice.",
      "Bookings are not confirmed until payment is settled. An unpaid booking does not reserve inventory and may be cancelled automatically.",
      "Nothing auto-renews. To continue past your term you must place a new booking.",
    ],
  },
  {
    heading: "4. Review and creative standards",
    paragraphs: [
      "Every paid booking is reviewed before going live. The creator may decline a booking at their discretion, in which case it is refunded in full.",
    ],
    bullets: [
      "Creative must not be misleading, deceptive, or misrepresent your product.",
      "Adult content, hate speech, harassment, malware, and illegal goods or services are prohibited.",
      "Bookings in direct competition with a current advertiser in the same category may be declined.",
      "You confirm you own or are licensed to use any asset you supply, and that the destination URL is lawful.",
    ],
  },
  {
    heading: "5. Delivery",
    paragraphs: [
      "Placements normally go live within 24 hours of the start date selected at checkout, subject to review and receipt of your creative.",
      "If you do not supply creative, the term still runs from the start date you selected. Supplying assets promptly is your responsibility.",
      "One creative swap per term is included at no cost.",
    ],
  },
  {
    heading: "6. Refunds",
    paragraphs: [
      "Because a placement is withdrawn from sale for the duration of your term, terms are committed once live and are not refundable on request.",
    ],
    bullets: [
      "Declined bookings are refunded in full.",
      "If a placement fails to run due to the creator's action or inaction, the affected period is refunded pro-rata.",
      "If a platform outside our control (for example X) removes or restricts the profile, remaining unserved time is refunded pro-rata.",
    ],
  },
  {
    heading: "7. No performance guarantee",
    paragraphs: [
      "Audience figures published on the Platform are historical and are provided for evaluation only. They are not a forecast and are not a guarantee of impressions, clicks, signups, or revenue.",
      "No specific commercial outcome is warranted.",
    ],
  },
  {
    heading: "8. Liability",
    paragraphs: [
      "To the maximum extent permitted by law, total aggregate liability arising from a booking is limited to the amount you paid for that booking.",
      "Neither party is liable for indirect or consequential losses, including lost profits or lost business opportunity.",
    ],
  },
  {
    heading: "9. Changes to these terms",
    paragraphs: [
      "These terms may be updated for future bookings. The terms in force at the time of your booking are the terms that govern it.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      intro="The rules that govern a placement booking: scope, payment, delivery, refunds and liability."
      updated="19 September 2026"
      blocks={BLOCKS}
    />
  );
}
