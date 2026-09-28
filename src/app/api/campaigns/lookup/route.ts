import { NextResponse } from "next/server";

import { campaignLookupSchema, fieldErrors } from "@/lib/validation";
import { findOrderByReference } from "@/server/bookings";

/**
 * POST /api/campaigns/lookup
 *
 * Advertiser campaign lookup. Requires both the booking reference and the email
 * used at checkout, so a guessed reference alone cannot expose campaign data.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = campaignLookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const rows = await findOrderByReference(
    parsed.data.reference.toUpperCase(),
    parsed.data.email,
  );

  if (rows.length === 0) {
    // Deliberately identical to a wrong-email response so the endpoint cannot
    // be used to confirm whether a reference exists.
    return NextResponse.json(
      { error: "No campaign found for that reference and email" },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      reference: rows[0].reference,
      creator: rows[0].creator,
      totalAmountCents: rows.reduce((sum, row) => sum + row.totalAmountCents, 0),
      campaigns: rows.map((row) => ({
        id: row.id,
        status: row.status,
        placement: {
          label: row.placement.label,
          kind: row.placement.kind,
          slotKey: row.placement.slotKey,
        },
        brandName: row.brandName,
        targetUrl: row.targetUrl,
        assetUrl: row.assetUrl,
        months: row.months,
        startDate: row.startDate,
        endDate: row.endDate,
        totalAmountCents: row.totalAmountCents,
        includesPromoPost: row.includesPromoPost,
        paidAt: row.paidAt,
        metrics: row.metrics,
        events: row.events.map((event) => ({
          type: event.type,
          message: event.message,
          createdAt: event.createdAt,
        })),
      })),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
