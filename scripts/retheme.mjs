/**
 * One-off codemod: migrates the old dark-only Tailwind classes (white alpha
 * rings, violet/cyan accents, raw palette colours) onto the new semantic design
 * tokens defined in globals.css.
 *
 * Run with: node scripts/retheme.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SKIP = new Set(["theme-toggle.tsx"]);

/** Ordered list of replacements; earlier rules win. */
const RULES = [
  // Alpha-on-white surfaces -> tokens
  [/ring-white\/(?:2[0-9]|3[0-9])\b/g, "ring-line-strong"],
  [/ring-white\/(?:[5-9]|1[0-9])\b/g, "ring-line"],
  [/border-white\/(?:2[0-9]|3[0-9])\b/g, "border-line-strong"],
  [/border-white\/(?:[5-9]|1[0-9])\b/g, "border-line"],
  [/divide-white\/(?:[5-9]|1[0-9])\b/g, "divide-line"],
  [/bg-white\/(?:1[0-9]|2[0-9])\b/g, "bg-subtle-strong"],
  [/bg-white\/[5-9]\b/g, "bg-subtle"],
  [/hover:bg-white\/(?:1[0-9]|2[0-9])\b/g, "hover:bg-subtle-strong"],

  // Surfaces
  [/bg-surface-raised\b/g, "bg-panel"],
  [/bg-surface\/\d+\b/g, "bg-panel"],

  // Accent ramp collapses to a single accent
  [/text-accent-soft\b/g, "text-accent"],
  [/hover:bg-accent-soft\b/g, "hover:bg-accent-hover"],
  [/bg-accent-soft\b/g, "bg-accent-hover"],
  [/ring-accent-soft\b/g, "ring-accent"],
  [/border-accent-soft\/\d+\b/g, "border-accent"],
  [/accent-alt\b/g, "accent"],
  [/text-white\b/g, "text-accent-fg"],

  // Raw palette colours -> semantic tokens
  [/(text|bg|ring|border|divide)-emerald-\d+(?:\/\d+)?\b/g, "$1-success"],
  [/(text|bg|ring|border|divide)-amber-\d+(?:\/\d+)?\b/g, "$1-warning"],
  [/(text|bg|ring|border|divide)-rose-\d+(?:\/\d+)?\b/g, "$1-danger"],
  [/(text|bg|ring|border|divide)-(?:sky|indigo|violet|fuchsia|cyan|blue|purple)-\d+(?:\/\d+)?\b/g, "$1-accent"],
  [/(text|bg|ring|border|divide)-zinc-\d+(?:\/\d+)?\b/g, "$1-muted"],

  // Removed effects
  [/\s*bmp-gradient-text\s*/g, " "],
  [/text-foreground\/8[05]\b/g, "text-muted"],
  [/text-foreground\/9[05]\b/g, "text-foreground"],

  // --- Pass 2: strip leftover gradients and unify heading weights ---
  // Accent-tinted gradient cards become a flat wash with a real border.
  [
    /bg-gradient-to-br from-accent\/\d+ to-transparent ring-accent\/\d+/g,
    "border-accent/35 bg-accent-wash",
  ],
  [
    /bg-gradient-to-br from-accent\/\d+ to-transparent/g,
    "border-accent/35 bg-accent-wash",
  ],
  // Wrappers that only existed to contain an absolutely-positioned glow.
  [/relative overflow-hidden border-b border-line/g, "border-b border-line"],
  [/relative overflow-hidden border-t border-line/g, "border-t border-line"],
  [/Section className="relative z-10 /g, 'Section className="'],
  // Editorial type: headings are bold, and letter-spacing comes from globals.
  [/text-4xl font-semibold tracking-tight/g, "text-4xl font-extrabold tracking-[-0.03em]"],
  [/text-3xl font-semibold tracking-tight/g, "text-3xl font-bold tracking-tight"],
  [/text-xl font-semibold tracking-tight/g, "text-xl font-bold"],
  [/text-lg font-semibold tracking-tight/g, "text-lg font-bold"],
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...walk(path));
    } else if (/\.tsx?$/.test(entry) && !SKIP.has(entry)) {
      out.push(path);
    }
  }
  return out;
}

let changed = 0;
for (const file of walk("src")) {
  const before = readFileSync(file, "utf8");
  let after = before;
  for (const [pattern, replacement] of RULES) {
    after = after.replace(pattern, replacement);
  }
  if (after !== before) {
    writeFileSync(file, after);
    changed += 1;
    console.log(`rethemed ${file}`);
  }
}
console.log(`\n${changed} file(s) updated.`);
