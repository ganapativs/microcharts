declare const __MCP_VERSION__: string;
declare const __LIBRARY_VERSION__: string;

export const MCP_VERSION: string = __MCP_VERSION__;

/**
 * The `@microcharts/react` version this build snapshots. Injected from the root
 * `package.json` at build time, never committed into `catalog.generated.json`:
 * `changeset version` bumps the library one commit AFTER the PR that regenerates
 * the catalog, so a committed stamp is stale the moment it is written and leaves
 * `gen:check` red on main until a second sync PR lands. The release job builds
 * this package after the bump, so the published stamp is the published version.
 */
export const LIBRARY_VERSION: string = __LIBRARY_VERSION__;
