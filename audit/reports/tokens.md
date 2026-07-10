# Token hygiene audit (agent report, 2026-07-10)

19 `--mc-*` tokens in styles.css. No consumed-but-undefined. No true duplicates (`--mc-band` vs `--mc-neutral` cleanly split: band=area fill, neutral=ghost stroke).

## Actionable findings
1. **Dead tokens:** `--mc-dot-size` (defined :root=2, preset overrides, ZERO consumers) and `--mc-radius` (defined 1px, never consumed). Remove or wire up.
2. **Stroke-width methodology split (visual-weight consistency bug class):**
   - 11 charts scale secondary strokes via `calc(var(--mc-stroke-width) * ratio)`: dual-window-meter, folded-day-band, slope, status-dot, micro-box, wind-barb, tree-rings, hypnogram, star-spoke, phase-trace, bullet.
   - ~90 charts use fixed literals; 14 distinct values: 0.4, 0.5(×14), 0.6(×23), 0.7(×3), 0.75(×24), 0.8(×13), 0.9(×6), 1(×72), 1.2, 1.25(×8), 1.4(×4), 1.5(×5), 1.75(×3), 1.8. These ignore presets (editorial 1.5 / vivid 2) and `prefers-contrast: more`.
   - Outlier singletons: 0.4 (spiral-year), 1.8 (star-spoke fixed variant).
   - Fix direction: standardize on calc(token × small ratio set) OR add `--mc-stroke-width-secondary`. Only `[data-mc-ink="data"]` is CSS-bound today.
3. **`rgba(255,255,255,0.96)` copy-pasted 3×** (time-in-range, trace-fold, partition-strip — text-on-fill). Extract shared constant (not necessarily a token).
4. **Lib vs docs preset drift** (`[data-mc-theme]` lib vs `[data-mc-preset]` docs, global.css:265–284):
   - vivid: lib stroke-width 2 / pos #00c896 / neg #ff5630; docs 2.25 / #10b981 / #f43f5e. DIFFERENT COLORS same preset name.
   - editorial: lib pins accent #b8112a; docs leaves to picker; docs sets dead --mc-dot-size.
   - mono: lib remaps neutral→stroke + moon; docs mixes neutral 55%, ignores moon.
   - Fix: single source of preset bundles.
5. Clean elsewhere: 0 hex/rgb/hsl in components (1 test fixture); fontSize literals are layout-estimate only (CSS `--mc-label-size` wins at render); docs binding intentional+documented.
