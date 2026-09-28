/** FAQ copy, kept as data so the page component stays presentational. */

export interface FaqGroup {
  title: string;
  items: { q: string; a: string }[];
}

export const FAQ_GROUPS: FaqGroup[] = [
  {
    title: "Placements",
    items: [
      {
        q: "What exactly am I buying?",
        a: "A defined region of a real X profile for a defined period. A product link places your URL and a short line of copy in the profile bio. The bio holds up to three product links at once, and your line is yours alone for the term. Cover slots give you one full half of the cover image, split straight down the middle. A cover half is $99 a month and a bio link is $89 a month, with lower monthly rates on 3, 6 and 12-month terms.",
      },
      {
        q: "How is this different from a sponsored post?",
        a: "A post is seen once as it passes through timelines. A profile placement is permanent for your term: it is seen by everyone who opens the profile, every day, including people arriving from older posts, replies and search.",
      },
      {
        q: "Can two brands share one slot?",
        a: "No. Each cover half is single-occupancy, and each product-link line in the bio belongs to one brand. Up to three brands can have a link in the bio at the same time, but nobody shares a line and nothing rotates. Once a slot is booked it is shown as unavailable until the term ends.",
      },
      {
        q: "Why is yearly so much cheaper?",
        a: "A 12-month booking takes 30% off: a cover half drops from $99 to $69 a month and a bio link from $89 to $62, paid once up front. 3 months takes 10% off ($89 / $80) and 6 months 20% ($79 / $71). Longer terms mean the slot is settled and the creative only needs to be set up once, and that saving is passed straight on.",
      },
      {
        q: "What is the launch special?",
        a: "Your product link in the bio for two weeks at a flat $29. It is a low-risk way to test the audience before committing to a month or more. It applies to the bio link only, and term discounts, bundle discounts and the promo post add-on do not stack with it.",
      },
      {
        q: "What if the placement I want is taken?",
        a: "The booking page shows the date it frees up and lets you choose a start date in the future, so you can reserve the next term in advance.",
      },
    ],
  },
  {
    title: "Creative & delivery",
    items: [
      {
        q: "What creative do I need to supply?",
        a: "A square logo (at least 512×512, PNG with transparency preferred) and your destination URL. For the bio link you can also suggest a short line of copy. Assets can be supplied during checkout or by replying to the confirmation email.",
      },
      {
        q: "How soon does my placement go live?",
        a: "Once payment clears, the booking enters review. Placements normally go live within 24 hours of the start date you selected, and the status is visible on your campaign page throughout.",
      },
      {
        q: "Can I change my creative mid-term?",
        a: "Yes: one swap per term at no cost. Send the replacement asset and it is updated at the next profile refresh.",
      },
      {
        q: "Is any advertiser accepted?",
        a: "No. Bookings are reviewed, and anything misleading, adult, hateful, or in a directly competing category to an existing advertiser may be declined and refunded in full.",
      },
    ],
  },
  {
    title: "Payments & refunds",
    items: [
      {
        q: "How do I pay?",
        a: "Checkout is handled by Dodo Payments, which supports cards, wallets and crypto and acts as merchant of record. You receive a proper tax invoice by email.",
      },
      {
        q: "Is this a subscription?",
        a: "No. You pay once for the term you selected. Nothing auto-renews; if you want to continue, you book again.",
      },
      {
        q: "What if my booking is declined?",
        a: "You are refunded in full and the slot is released back into inventory immediately.",
      },
      {
        q: "Can I cancel mid-term?",
        a: "The term is committed once live, because the slot was withdrawn from sale for that period. If a placement fails to run for reasons on my side, the affected time is refunded pro-rata.",
      },
    ],
  },
  {
    title: "Analytics & reporting",
    items: [
      {
        q: "Where do the audience numbers come from?",
        a: "Directly from X Analytics, for the rolling window stated next to each figure. The analytics page shows exact start and end dates rather than an all-time total.",
      },
      {
        q: "Will I get performance reporting?",
        a: "Yes. Your campaign page tracks impressions, clicks and profile visits attributed to your run, alongside a full status history.",
      },
      {
        q: "Can you guarantee clicks or conversions?",
        a: "No, and anyone who does is guessing. What is guaranteed is exclusive placement for your full term on a profile whose historical reach is published openly so you can judge it yourself.",
      },
    ],
  },
];
