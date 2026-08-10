# Fixtures

Real apps that consume `@microcharts/react` to prove it works where it must:

- **`next/`** — Next.js App Router. Asserts static charts render in a **Server Component with zero client JS** (the
  RSC-native claim). A build-output smoke test checks no `"use client"` chunk ships for static charts.
- **`vite/`** — Vite + React. Asserts SSR + CSR hydration and the interactive (`…/interactive`) entries behave.

**Status:** `next/` is **live** — `pnpm --filter @microcharts/fixture-next build` static-exports a Server Component page
that imports 24 real chart types from their own subpaths (plus annotations, `SparkGroup`, and the two inline-HTML
charts), and `… verify` (verify-rsc.mjs) asserts every chart and its generated summary are in the static HTML with zero
client JS. Both run in CI (the `rsc` job). `vite/` is still to come (SSR + interactive-entry checks).

They are pnpm workspace packages (`pnpm-workspace.yaml` → `packages: [fixtures/*]`) so
`pnpm --filter @microcharts/fixture-next <script>` works.
