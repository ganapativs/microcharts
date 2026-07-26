---
"@microcharts/react": patch
---

Four consistency defects found reviewing the readout pass — three of them the same rule the pass itself was enforcing,
one file over.

**Eight charts ignored `summary`.** `BalanceBeam`, `DicePips`, `FatDigits`, `FillWord`, `MoonPhase`, `PictogramRow`,
`TallyMarks` and `Thermometer` shadowed the `summary` PROP with the generated sentence (`const summary = fooSummary(…)`)
and named the wrapper from that. So `summary={false}` — the decorative opt-out — reached the static child and stopped
there: the wrapper stayed a named, focusable `role="img"`, which is exactly the state `TokenConfidence` was just fixed
for. A caller's `summary="…"` string was dropped the same way. The wrapper reads `props.summary` now, and
`decorative-naming.browser.test.tsx` covers all eleven interactive entries in it, both directions (`false` hides, a
string names).

**Two rendered strings were English no bundle could translate.** `HeatCell`'s new chip built `"42 — level 3 of 5"`
inline instead of going through `strings` (its own `levelChip` token now, beside the pass's `heartbeatChip` /
`tokenChip` / `iconArrayChip` / `pictogramChip`), and `IconArray`'s painted ratio label — `"3 in 20"`, its DEFAULT label
mode, not a chip — had been an inline template since it shipped (`iconArrayRatio`). Twelve more charts joined
`i18n-strings.browser.test.tsx`, which is what caught the second one.

**`TokenConfidence`'s chip hung over unrelated words.** It cleared on `pointerleave` of the host — but the host is a
paragraph, so the pointer leaves a flagged token onto ordinary prose long before it leaves the host, and the chip sat
there naming a token the reader was no longer pointing at. Moving off any flagged token clears it.

Also: `eta-bar/interactive`'s budget sat 2 B under the built entry, so `pnpm size` was red on the branch (3.62 → 3.63
kB), and `performance.mdx` quoted a stale interactive floor (2.02 → 2.03 kB) that its own guard rejects.
