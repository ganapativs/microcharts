/**
 * Shared grammar — documented once for `catalog.json`, PropTable footer, and
 * `prop-parity.test.ts` (`SHARED_PROP_NAMES` / `SHARED_INTERACTIVE_NAMES`).
 * Descriptions mirror quickstart#the-shared-grammar — keep in sync.
 */
import type { ChartProp } from "./types";
/** Interactive-only shared props — see `types.ts` (`picker` / `animates` flags). */
export declare const SHARED_INTERACTIVE_PROPS: ChartProp[];
export declare const SHARED_PROPS: ChartProp[];
/**
 * Static shared names per-chart tables may omit. `size`, `fontSize`, `gap`, `cell`
 * left this set — not universal and not one meaning across charts; each chart
 * documents its own row (`prop-parity` enforces).
 */
export declare const SHARED_PROP_NAMES: ReadonlySet<string>;
export declare const SHARED_INTERACTIVE_NAMES: ReadonlySet<string>;
