import { NextResponse } from "next/server";

import { quoteRequestSchema, fieldErrors } from "@/lib/validation";
import { BookingError, quoteForRequest } from "@/server/bookings";

/**
 * POST /api/quote
 *
 * Prices a prospective order server-side. The client never supplies amounts;
 * it sends the selection and receives the authoritative breakdown, so the
 * displayed total always matches what will be charged.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const { pricing } = await quoteForRequest(parsed.data);
    return NextResponse.json(
      { pricing },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.code === "CREATOR_NOT_FOUND" ? 404 : 400 },
      );
    }
    console.error("[api/quote]", error);
    return NextResponse.json(
      { error: "Could not calculate a quote" },
      { status: 500 },
    );
  }
}
