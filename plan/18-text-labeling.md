# 18 — Decision: Text Labeling & Metrics (static-safe)

> Status: decided 2026-07-06 · Resolves the direct-label ↔ static-no-JS tension flagged in the tooling review.
> Load-bearing constraint: **text width is unmeasurable at static render time** — `getComputedTextLength`/`getBBox` return 0 in jsdom and are unavailable server-side (no layout engine). CONFIRMED durable-canonical.

## Context

Two commitments collide:

- Design principle: **direct labels** (no legends/axes) — value endpoints, deltas, min/max markers labeled in place.
- Architecture: **static-first RSC**, zero client JS, SVG rendered on the server.

You cannot measure a string's pixel width without a browser. So the static path may not depend on measurement for placement, right-alignment, gutter sizing, or overlap avoidance.

## Decision

**Static default path renders numeric labels only, placed by anchoring — never by measurement.**

1. **Anchor, don't measure.** Value labels align with `text-anchor="end"` (or `start`/`middle`) pinned to a **known x** (chart edge, mark x). Exact string width is never needed — the anchor does the work. Right-aligned value columns line up perfectly without knowing their width.
2. **Tabular numerals = deterministic width.** `font-variant-numeric: tabular-nums` (already mandated) makes every digit equal-advance _within any font_. So formatted-number width scales with **digit count**, which is knowable at render time from `String(format(value)).length` — pure data + formatter, no DOM.
3. **Gutters in `ch`/`em`, not `px`.** When space must be reserved (label gutter beside a chart), width = `maxFormattedLength` in `ch` units. `ch` resolves per-font at layout, so the reservation is font-agnostic and needs no measurement. `maxFormattedLength` = `Math.max(...values.map(v => format(v).length))`, computed server-side.
4. **Non-numeric / categorical text: anchor-only in the static path.** Text labels are placed by `text-anchor` at known positions with **no measured collision avoidance**. Where labels could collide (dense categorical), the static path either (a) omits them below a size threshold, or (b) defers to the interactive entry. This is a **documented limitation**, not a bug.
5. **Interactive/client entries MAY measure.** A browser exists there, so `getComputedTextLength` is allowed for precise dodge/collision/truncation. Richer labeling is a client-entry capability, consistent with the static↔client split.

## Consequences

- ✅ Value endpoints, deltas, KPI numbers, min/max markers, and right-aligned value columns all render correctly **statically, zero JS**.
- ✅ Font-agnostic: alignment is relative (anchor + tabular `ch`), never absolute px — holds across any consumer font.
- ⚠️ Categorical **text** labels in the static path are anchor-placed only; measured layout (dodge, ellipsis-fit) is a client-entry feature or a small-size drop-out. Document per chart.
- 🚧 **Guard:** static components must never call `getBBox`/`getComputedTextLength`/`getScreenCTM`. Add a lint/test guard asserting those symbols are absent from `index.tsx` (client-only in `client.tsx`).

## How to apply

- `core/summary.ts` + label helpers position via `text-anchor` + known x; gutter width from formatter output length in `ch`.
- Never compute pixel text width in `src/charts/*/index.tsx`. The two-project Vitest split (node vs browser) already fences this; add an assertion.
- Chart docs state, per type, whether text labels are static-anchored or client-measured.
