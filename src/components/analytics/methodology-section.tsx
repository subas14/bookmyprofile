import {
  ButtonLink,
  Card,
  Section,
  SectionHeading,
  TrustItem,
} from "@/components/ui";

/** How the published figures are produced, and how to verify them. */
export function MethodologySection({
  profileUrl,
  handle,
}: {
  profileUrl: string;
  handle: string;
}) {
  return (
    <div className="border-t border-line bg-panel">
      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Methodology"
              title="How these numbers are produced"
            />
            <div className="mt-8 space-y-5">
              <TrustItem title="Straight from X Analytics">
                Impressions, profile visits, engagements and follower counts are
                read from the native X Analytics dashboard for the stated window,
                not estimated by a third-party tool.
              </TrustItem>
              <TrustItem title="Windows, not all-time totals">
                Every figure is tied to a start and end date. All-time numbers
                flatter the seller and tell you nothing about current reach.
              </TrustItem>
              <TrustItem title="Audience composition is a sample">
                Location, role and interest splits are modelled from the
                audience data X exposes, and are presented as shares rather than
                precise counts.
              </TrustItem>
              <TrustItem title="Campaign reporting during your term">
                Once live, your campaign carries its own tracked metrics that
                you can check at any time from the campaign page.
              </TrustItem>
            </div>
          </div>

          <Card className="h-fit bg-surface">
            <h2 className="text-lg font-bold">
              Want to verify independently?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Open the profile and judge it yourself. Post frequency, replies,
              and who engages are all public. If anything here does not match
              what you see, tell me and I will correct it.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={profileUrl} external>
                View {handle} on X
              </ButtonLink>
              <ButtonLink href="/book" variant="secondary">
                Book a placement
              </ButtonLink>
            </div>
          </Card>
        </div>
      </Section>
    </div>
  );
}
