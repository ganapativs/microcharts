# Fixtures

Real apps that consume `@microcharts/react` to prove it works where it must:

- **`next/`** — Next.js App Router. Asserts static charts render in a **Server
  Component with zero client JS** (the RSC-native claim, plan/03). A build-output
  smoke test checks no `"use client"` chunk ships for static charts.
- **`vite/`** — Vite + React. Asserts SSR + CSR hydration and the interactive
  (`…/interactive`) entries behave.

**Status: not yet wired.** These activate at **Checkpoint 1** (plan/10 §1), when
the first hand-assembled `<Sparkline>` exists to render — there is nothing to
mount until a chart lands. Wiring them earlier would only install Next/Vite
against an empty library. Tracked in [../plan/STATUS.md](../plan/STATUS.md) (0.4).

When wired, they become pnpm workspace packages (added to `pnpm-workspace.yaml`
`packages:`) so `pnpm -F next build` / `pnpm -F vite dev` work.
