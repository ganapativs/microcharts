// The published version, read once at *config* time (tsdown + vitest) and
// injected as the `__MC_VERSION__` compile-time constant.
//
// Deliberately not `import pkg from '../package.json'` inside src/: that pulls
// the whole manifest — keywords, exports map, every dependency range — into the
// module graph, and bundlers that can't statically narrow a JSON namespace ship
// the lot. Config files run in Node and are never bundled, so reading it here
// costs the output exactly one string literal.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** @type {string} */
export const pkgVersion = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../package.json"), "utf8"),
).version;

/** `define` entries shared by the tsdown build and the vitest projects. */
export const versionDefine = { __MC_VERSION__: JSON.stringify(pkgVersion) };
