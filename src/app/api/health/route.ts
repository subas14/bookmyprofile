import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isPaymentsConfigured } from "@/lib/env";

/**
 * GET /api/health
 *
 * Readiness probe for deployment platforms. Reports database connectivity and
 * whether payments are configured, without exposing any secret values.
 */
export async function GET() {
  let database = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("[api/health] database check failed", error);
    database = "error";
  }

  const healthy = database === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      database,
      payments: isPaymentsConfigured() ? "configured" : "not_configured",
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
