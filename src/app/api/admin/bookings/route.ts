import { NextResponse } from "next/server";

import { bookingDecisionSchema, fieldErrors } from "@/lib/validation";
import { transitionBooking, type BookingAction } from "@/server/bookings";
import { isAdminRequest } from "@/server/auth";

/**
 * POST /api/admin/bookings
 *
 * Creator moderation endpoint: approve, reject, activate, complete or cancel a
 * booking. Allowed transitions are enforced in the booking service, so an
 * invalid state change is rejected even if requested directly.
 */
export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bookingDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const result = await transitionBooking({
    bookingId: parsed.data.bookingId,
    action: parsed.data.action as BookingAction,
    reason: parsed.data.reason,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
