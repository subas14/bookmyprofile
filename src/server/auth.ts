import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/lib/env";

/**
 * Creator console authentication.
 *
 * The launch product has a single creator, so a shared bearer token held in
 * `ADMIN_TOKEN` is sufficient and avoids shipping a half-built user system.
 * The token is compared in constant time and stored in an HttpOnly cookie.
 *
 * When the platform opens to multiple creators this module is the single place
 * that needs to become a real session/identity layer.
 */

export const ADMIN_COOKIE = "bmp_admin";

/** Constant-time string comparison that tolerates differing lengths. */
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** True when the supplied token matches the configured admin token. */
export function isValidAdminToken(token: string | undefined | null): boolean {
  const expected = serverEnv().ADMIN_TOKEN;
  // An unset ADMIN_TOKEN must never grant access.
  if (!expected || !token) return false;
  return safeEqual(token, expected);
}

/** True when the current request carries a valid admin cookie. */
export async function isAdminRequest(): Promise<boolean> {
  const store = await cookies();
  return isValidAdminToken(store.get(ADMIN_COOKIE)?.value);
}

/** True when admin access is possible at all (token configured). */
export function isAdminConfigured(): boolean {
  return Boolean(serverEnv().ADMIN_TOKEN);
}

/** Cookie options for the admin session cookie. */
export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  };
}
