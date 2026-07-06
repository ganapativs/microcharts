# 11 — Open-Source Operations

> Status: draft v1 · Inputs: verified 2026 OSS engineering research

## 1. Legal & governance

- **License: MIT** (10/13 peer chart libs; Apache-2.0 outliers all had institutional reasons we lack; corporate pre-approval friction is zero).
- **CoC: Contributor Covenant 3.0** (current since July 2025; attribution under CC BY-SA 4.0), via its builder with project contact filled in.
- `.github/`: CONTRIBUTING.md (Conventional Commits, dev setup, PR checklist, response-time expectations), SECURITY.md (private reporting via GitHub advisories), SUPPORT.md, issue forms (bug: version/repro/data sample required; feature; chart-request template), PR template.

## 2. Release engineering

- **Changesets** for versioning + changelog (human checkpoint before publish — deliberate, given 2025–26 supply-chain climate).
- **npm trusted publishing (OIDC)**: per-package trusted publisher bound to the release workflow file; `id-token: write` scoped to the publish job only; provenance automatic. Note: configs created after 2026-05-20 must explicitly select allowed actions.
- npm ≥ 11.5.1 in release job; `engines.node` declared; 2FA on the npm account regardless.
- Prereleases: `0.x` during Phases 1–3; `next` dist-tag for release candidates.
- Renovate (grouped, automerge dev-deps, dependency dashboard). Only dev-deps exist — runtime is zero-dep by CI check.

## 3. Supply-chain posture (2026 context: Shai-Hulud worms, npm v12)

- Zero runtime deps = minimal blast surface (also the product thesis).
- Lockfile committed; provenance on; no install scripts in our package (npm v12 disables them by default anyway).
- GitHub Actions pinned by SHA; least-privilege workflow permissions; no long-lived tokens anywhere.

## 4. Docs & community infrastructure

- Fumadocs (React/Next-native) docs site (see `09`/`10`), deployed on push to main; versioned docs when v2 diverges.
- llms.txt + markdown mirror (AI-agent discovery; early-mover in charting niche).
- GitHub Discussions on (Q&A + Show-and-tell for community presets); issues reserved for bugs/features.
- Good-first-issue gardening from Phase 5; chart-request template channels demand data for catalog ordering.

## 5. Maintenance credibility signals

The category died of maintainer abandonment — counter-signal deliberately:

- Public roadmap (this plan's Phase 5/6 published as GitHub project board).
- Monthly release cadence even if patch-only ("boring but alive").
- Issue triage SLA stated in CONTRIBUTING (e.g., first response ≤ 1 week).
- CI badges that mean something: bundle size, zero deps, a11y pass — receipts, not decorations.

## 6. Adoption instrumentation

- Track: npm downloads, bundle-size-over-time chart (dogfooded — rendered with microcharts), GitHub stars/issues, docs analytics (privacy-friendly).
- Quarterly review drives catalog ordering + kill/keep decisions.
