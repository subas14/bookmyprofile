import { Badge, Section, SectionHeading } from "@/components/ui";

/**
 * Screen-recorded walkthrough of the live X Analytics dashboard.
 *
 * This is the proof behind every published figure: the raw dashboard, on
 * camera, so an advertiser can see the numbers were read straight from X and
 * not assembled after the fact. Served statically from /public/media.
 *
 * The video is deliberately native `<video>` with no autoplay and no client
 * JavaScript: it is muted-capable, controllable, and preloads only metadata so
 * the page stays light until the viewer chooses to watch.
 */
export function WalkthroughVideo({
  src = "/media/analytics-walkthrough.mp4",
  handle,
}: {
  src?: string;
  handle: string;
}) {
  return (
    <div className="border-t border-line bg-panel">
      <Section className="py-12 sm:py-14">
        <SectionHeading
          eyebrow="Screen recording"
          title="The dashboard, on camera"
          description={`A walkthrough of the live X Analytics dashboard for ${handle}, recorded end to end. Every number on this page is read from the screens in this clip, so nothing here is assembled after the fact.`}
        />

        <figure className="mx-auto mt-10 max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-line bg-foreground shadow-[var(--shadow-pop)]">
            <video
              className="aspect-video h-auto w-full"
              controls
              playsInline
              preload="metadata"
              controlsList="nodownload"
            >
              <source src={src} type="video/mp4" />
              Your browser does not support embedded video. You can{" "}
              <a href={src} className="underline">
                open the recording directly
              </a>
              .
            </video>
          </div>
          <figcaption className="mt-4 flex flex-wrap items-center justify-center gap-2.5 text-center">
            <Badge tone="success">
              <span
                aria-hidden
                className="bmp-live-dot h-1.5 w-1.5 rounded-full bg-success"
              />
              Unedited screen capture
            </Badge>
            <span className="text-xs text-muted">
              Recorded from the native X Analytics dashboard.
            </span>
          </figcaption>
        </figure>
      </Section>
    </div>
  );
}
