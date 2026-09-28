/**
 * Date/term helper self-check: the maths that availability depends on.
 * Run with: npm run test:dates
 */
import {
  addMonthsUtc,
  daysBetween,
  rangesOverlap,
  startOfUtcDay,
  termEndDate,
  termProgress,
  toDateInputValue,
} from "../src/lib/dates.ts";

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = String(actual) === String(expected);
  if (!ok) failures += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label}\n      expected ${expected}, got ${actual}`,
  );
}

const jan31 = startOfUtcDay("2026-01-31");

// Month-end clamping: 31 Jan + 1 month must not roll into March.
check("31 Jan + 1mo clamps to Feb", toDateInputValue(addMonthsUtc(jan31, 1)), "2026-02-28");
check("31 Jan + 3mo", toDateInputValue(addMonthsUtc(jan31, 3)), "2026-04-30");
check("31 Jan + 12mo", toDateInputValue(addMonthsUtc(jan31, 12)), "2027-01-31");

// Leap year.
const jan31Leap = startOfUtcDay("2028-01-31");
check("leap year Feb clamp", toDateInputValue(addMonthsUtc(jan31Leap, 1)), "2028-02-29");

// Term end dates.
const mar1 = startOfUtcDay("2026-03-01");
check("1-month term end", toDateInputValue(termEndDate(mar1, 1)), "2026-04-01");
check("6-month term end", toDateInputValue(termEndDate(mar1, 6)), "2026-09-01");
// Launch special (months = 0) is a fixed 14-day window.
check("launch special term end (+14 days)", toDateInputValue(termEndDate(mar1, 0)), "2026-03-15");

// Overlap semantics: inclusive start, exclusive end, so back-to-back terms
// must NOT be treated as overlapping.
const a1 = startOfUtcDay("2026-03-01");
const a2 = startOfUtcDay("2026-04-01");
const b1 = startOfUtcDay("2026-04-01");
const b2 = startOfUtcDay("2026-05-01");
check("back-to-back terms do not overlap", rangesOverlap(a1, a2, b1, b2), false);
check("identical terms overlap", rangesOverlap(a1, a2, a1, a2), true);
check(
  "partially nested terms overlap",
  rangesOverlap(a1, b2, startOfUtcDay("2026-03-15"), startOfUtcDay("2026-04-15")),
  true,
);
check(
  "fully contained term overlaps",
  rangesOverlap(a1, b2, startOfUtcDay("2026-03-10"), startOfUtcDay("2026-03-20")),
  true,
);

// Day counting.
check("days in March", daysBetween(a1, a2), 31);

// Term progress clamping.
check("progress before start is 0", termProgress(a1, b2, startOfUtcDay("2026-02-01")), 0);
check("progress after end is 1", termProgress(a1, b2, startOfUtcDay("2026-06-01")), 1);

// Timezone safety: a late-evening local timestamp must still normalise to the
// correct UTC day, so terms never shift by one day depending on server locale.
check(
  "UTC normalisation",
  toDateInputValue(startOfUtcDay(new Date("2026-03-01T23:59:59Z"))),
  "2026-03-01",
);

console.log(
  failures === 0
    ? "\nAll date checks passed."
    : `\n${failures} date check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
