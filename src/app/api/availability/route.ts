import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { availabilityForTerm } from "@/server/availability";
import { availabilityQuerySchema } from "@/lib/validation";
import { startOfUtcDay, todayUtc } from "@/lib/dates";
import { fieldErrors } from "@/lib/validation";

/**
 * GET /api/availability?creatorSlug=…&months=1&startDate=YYYY-MM-DD
 *
 * Returns, for each placement, whether the requested term can be booked and
 * when it next frees up. Used by the booking UI to disable taken slots.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = availabilityQuerySchema.safeParse({
    creatorSlug: url.searchParams.get("creatorSlug") ?? undefined,
    months: url.searchParams.get("months") ?? undefined,
    startDate: url.searchParams.get("startDate") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const creator = await prisma.creator.findFirst({
    where: { slug: parsed.data.creatorSlug, isActive: true },
    select: { id: true },
  });
  if (!creator) {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  }

  const start = parsed.data.startDate
    ? startOfUtcDay(parsed.data.startDate)
    : todayUtc();

  const availability = await availabilityForTerm(
    creator.id,
    start,
    parsed.data.months,
  );

  return NextResponse.json(
    {
      startDate: start.toISOString().slice(0, 10),
      months: parsed.data.months,
      placements: availability,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
