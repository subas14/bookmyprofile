import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ADMIN_COOKIE,
  adminCookieOptions,
  isAdminConfigured,
  isValidAdminToken,
} from "@/server/auth";

const loginSchema = z.object({ token: z.string().min(1) });

/** POST /api/admin/session: exchange the admin token for a session cookie. */
export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin access is not configured on this deployment" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success || !isValidAdminToken(parsed.data.token)) {
    // Uniform message so the response cannot distinguish malformed from wrong.
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, parsed.data.token, adminCookieOptions());
  return response;
}

/** DELETE /api/admin/session: sign out. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", {
    ...adminCookieOptions(),
    maxAge: 0,
  });
  return response;
}
