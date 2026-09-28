import { prisma } from "@/lib/prisma";
import { INVENTORY_BLOCKING_STATUSES } from "@/lib/domain";
import { startOfUtcDay, termEndDate, todayUtc } from "@/lib/dates";

/**
 * Inventory availability.
 *
 * A placement can hold `maxConcurrent` simultaneous bookings. A candidate term
 * is bookable when the number of overlapping non-cancelled bookings is below
 * that ceiling.
 */

export interface PlacementAvailability {
  slotKey: string;
  /** Overlapping bookings that already consume inventory. */
  overlapping: number;
  maxConcurrent: number;
  available: boolean;
  /** When unavailable, the first date the placement frees up. */
  nextAvailableFrom: Date | null;
}

/** Overlapping bookings for a creator's placements within a date window. */
async function overlappingBookings(
  creatorId: string,
  start: Date,
  end: Date,
) {
  return prisma.booking.findMany({
    where: {
      creatorId,
      status: { in: [...INVENTORY_BLOCKING_STATUSES] },
      // Inclusive-start / exclusive-end overlap: start < end AND end > start.
      startDate: { lt: end },
      endDate: { gt: start },
    },
    select: { placementId: true, endDate: true },
  });
}

/**
 * Computes availability for every active placement of a creator for the given
 * term. Returns a map keyed by `slotKey`.
 */
export async function availabilityForTerm(
  creatorId: string,
  startDate: Date,
  months: number,
): Promise<Record<string, PlacementAvailability>> {
  const start = startOfUtcDay(startDate);
  const end = termEndDate(start, months);

  const [placements, bookings] = await Promise.all([
    prisma.placement.findMany({
      where: { creatorId, isActive: true },
      select: { id: true, slotKey: true, maxConcurrent: true },
    }),
    overlappingBookings(creatorId, start, end),
  ]);

  const byPlacement = new Map<string, Date[]>();
  for (const booking of bookings) {
    const list = byPlacement.get(booking.placementId) ?? [];
    list.push(booking.endDate);
    byPlacement.set(booking.placementId, list);
  }

  const result: Record<string, PlacementAvailability> = {};
  for (const placement of placements) {
    const ends = byPlacement.get(placement.id) ?? [];
    const overlapping = ends.length;
    const available = overlapping < placement.maxConcurrent;

    // Freed up once enough of the overlapping terms have ended. With the
    // common maxConcurrent=1 case this is simply the latest end date.
    let nextAvailableFrom: Date | null = null;
    if (!available && ends.length > 0) {
      const sorted = [...ends].sort((a, b) => a.getTime() - b.getTime());
      const index = Math.max(0, sorted.length - placement.maxConcurrent);
      nextAvailableFrom = sorted[index] ?? sorted[sorted.length - 1];
    }

    result[placement.slotKey] = {
      slotKey: placement.slotKey,
      overlapping,
      maxConcurrent: placement.maxConcurrent,
      available,
      nextAvailableFrom,
    };
  }

  return result;
}

/**
 * Re-checks availability for a specific set of placements immediately before a
 * booking is written. Returns the slot keys that are NOT bookable.
 */
export async function findUnavailableSlots(
  creatorId: string,
  slotKeys: string[],
  startDate: Date,
  months: number,
): Promise<string[]> {
  const availability = await availabilityForTerm(creatorId, startDate, months);
  return slotKeys.filter((key) => !availability[key]?.available);
}

/** Earliest date a new campaign may start (today, UTC). */
export function earliestStartDate(): Date {
  return todayUtc();
}
