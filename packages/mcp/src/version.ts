/**
 * This package's own version, injected at build time by tsdown `define` (and by
 * vitest `define` for tests) from package.json — the same pattern the library
 * uses for `__MC_VERSION__`. Kept out of the generated snapshot so a version
 * bump never needs a re-`gen` to stay accurate.
 */
declare const __MCP_VERSION__: string;

export const MCP_VERSION: string = __MCP_VERSION__;
