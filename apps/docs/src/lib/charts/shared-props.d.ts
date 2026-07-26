/**
 * The shared grammar — props whose name means the same thing on every chart, so
 * they're documented ONCE here instead of repeated in every per-chart table.
 *
 * Three consumers read this single source:
 *  - `catalog.json` emits it as a top-level `sharedProps` block so the machine
 *    catalog is a complete reference (not just chart-specific knobs).
 *  - `PropTable`'s footer links here rather than re-listing.
 *  - `prop-parity.test.ts` derives its allow-lists from `SHARED_PROP_NAMES` /
 *    `SHARED_INTERACTIVE_NAMES`, so a prop can never be "shared" in the docs but
 *    still flagged as drift by the guard (or vice-versa).
 *
 * Descriptions mirror quickstart#the-shared-grammar — keep them in sync.
 */
import type { ChartProp } from "./types";
/** The shared grammar — encoding vocabulary common to the whole catalog. */
export declare const GRAMMAR_PROPS: ChartProp[];
/** Layout / container props every chart accepts. */
export declare const LAYOUT_PROPS: ChartProp[];
/** Internationalization plumbing — string bundles, shared with `strings`. */
export declare const I18N_PROPS: ChartProp[];
/**
 * The shared INTERACTIVE grammar — props that exist only on `/interactive`
 * entries but mean the same thing wherever they appear.
 *
 * `animate` is on every interactive entry whose marks can carry an entrance
 * (`entry.animates === false` marks the ones that can't). `live` is narrower
 * still — only the entries whose value can change under a static cursor
 * declare it. The four picker props
 * (`onActive`, `onSelect`, `selectedIndex`, `defaultSelectedIndex`) come from
 * `PickerProps`. `onActive`/`onSelect` are on EVERY interactive entry — a chart
 * with one unit still has that unit hovered, focused and activated. The two index
 * props are the roving half and exist only on charts with more than one navigable
 * unit; `entry.picker === false` marks the ones without (see `types.ts`).
 */
export declare const SHARED_INTERACTIVE_PROPS: ChartProp[];
/** Everything, in the order the catalog reference should list it. */
export declare const SHARED_PROPS: ChartProp[];
/**
 * Static-side shared prop names the per-chart guard/table may omit — the
 * documented grammar (each name means the same thing everywhere, so it is listed
 * once above) plus the structural React props.
 *
 * `size`, `fontSize`, `gap` and `cell` used to sit here as "sizing-ish universal
 * knobs treated as layout". They are not universal: only 31 charts accept any of
 * them, and they do not mean the same thing across those 31 (`size` is a glyph's
 * square edge, `cell` exists only on the grids, `gap` is viewBox units on most
 * charts but an empty *fraction* of the slot on SparkBar). Nothing here can be
 * documented centrally without lying, and being here excused every chart from
 * documenting them at all — so they left the shared set, and each chart now
 * carries its own row, which the `prop-parity` guard enforces.
 */
export declare const SHARED_PROP_NAMES: ReadonlySet<string>;
/** Interactive-only shared prop names — documented once, omitted per chart. */
export declare const SHARED_INTERACTIVE_NAMES: ReadonlySet<string>;
