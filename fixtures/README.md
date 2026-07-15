# Fixtures

Real apps that consume `@microcharts/react` to prove it works where it must:

- **`next/`** — Next.js App Router. Asserts static charts render in a **Server Component with zero client JS** (the
  RSC-native claim, plan/03). A build-output smoke test checks no `"use client"` chunk ships for static charts.
- **`vite/`** — Vite + React. Asserts SSR + CSR hydration and the interactive (`…/interactive`) entries behave.

**Status:** `next/` is **live** (Checkpoint 1 passed) — `pnpm --filter @microcharts/fixture-next build` static-exports a
page whose hand-assembled `<Sparkline>` renders server-side, and `… verify` (verify-rsc.mjs) asserts the SVG +
auto-summary are in the static HTML with zero client JS. Both run in CI (the `rsc` job). `vite/` is still to come (SSR +
interactive-entry checks).

They are pnpm workspace packages (`pnpm-workspace.yaml` → `packages: [fixtures/*]`) so
`pnpm --filter @microcharts/fixture-next <script>` works.
