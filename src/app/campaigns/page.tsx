import type { Metadata } from "next";

import { Section } from "@/components/ui";
import { CampaignLookup } from "@/components/campaigns/campaign-lookup";

export const metadata: Metadata = {
  title: "Track your campaign",
  description:
    "Look up a BookMyProfile campaign with your booking reference to see its " +
    "status, dates and performance.",
  robots: { index: false, follow: true },
};

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <div className="border-b border-line">
        <Section className="py-16">
          <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            Track your campaign.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Status, dates and performance for anything you have booked, with no
            account required.
          </p>
        </Section>
      </div>

      <Section className="py-12">
        <div className="mx-auto max-w-3xl">
          <CampaignLookup initialReference={params.reference ?? ""} />
        </div>
      </Section>
    </>
  );
}
