/**
 * Resolves the `@/*` TypeScript path alias when running scripts directly under
 * Node (outside the Next.js bundler), so verification scripts can exercise the
 * real production modules without changing their import style.
 *
 * Usage:
 *   node --experimental-strip-types --import ./scripts/alias-hooks.mjs <script>
 */
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const srcRoot = resolvePath(projectRoot, "src");

/** Appends the correct extension for an extensionless TS specifier. */
function withExtension(absPath) {
  if (existsSync(absPath)) return absPath;
  for (const candidate of [
    `${absPath}.ts`,
    `${absPath}.tsx`,
    resolvePath(absPath, "index.ts"),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  return absPath;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = withExtension(
        resolvePath(srcRoot, specifier.slice(2)),
      );
      return { url: pathToFileURL(target).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
