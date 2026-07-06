# 15 — The Expressive Collection (22 types, consolidated)

> Status: v2 — consolidated after editorial review (was 35; cut ledger at bottom).
> The test each survivor passed: **(a)** a sighted stranger can read the value back without training, **(b)** the encoding channel is honest and documented, **(c)** it tells a data story no core chart tells, **(d)** a senior designer would respect it, not roll eyes.
> Ships as **`@microcharts/expressive`** — same grammar, tokens, a11y summaries, and budgets as core.

## Typographic — the text is the chart (2)

| # | Type | Encoding | Use |
|---|---|---|---|
| E1 | **FatDigits** | numeral ink weight ∝ its value (FatFonts research, Nacenta et al.) | numbers that carry their own magnitude in dense tables |
| E2 | **FillWord** | horizontal glyph fill = % complete | progress where the label is the bar ("uploading") |

## Organic & natural forms (5)

| # | Type | Encoding | Use |
|---|---|---|---|
| E3 | **TreeRings** | ring spacing ∝ per-period value, current ring accented | yearly/era growth — cohort age, anniversaries |
| E4 | **MoonPhase** | illuminated fraction = % of cycle | sprint/billing-period/quota progress; culturally universal |
| E5 | **Constellation** | point position = time × value, dot size = magnitude, faint connectors | sparse rare events with romance — outages, milestones |
| E6 | **SproutRow** | growth stage per category (seed→sprout→leaf→bloom) | ordinal maturity/health per account or project |
| E7 | **GardenGrid** | dot **radius** ∝ value in a grid | ActivityGrid's size-channel sibling — better in grayscale/print, warmer |

## Instruments & analog devices (3)

| # | Type | Encoding | Use |
|---|---|---|---|
| E8 | **Thermometer** | column height in a ticked tube + bulb | value on a calibrated range — fundraising, temperature metaphors |
| E9 | **BalanceBeam** | beam tilt ∝ ratio of two sized weights | two-sided comparison — buy/sell, in/out, pro/con |
| E10 | **Hourglass** | sand split top/bottom = elapsed vs remaining | deadlines, TTLs, session expiry — the two-sided time story Progress can't tell |

## Historical & cultural notation (3)

| # | Type | Encoding | Use |
|---|---|---|---|
| E11 | **TallyMarks** | four-and-strike groups | live counts with a human hand — scores, RSVPs |
| E12 | **DicePips** | pip patterns 1–6 (subitizing — perceptual science, not style) | instantly-read small counts — ratings, severity |
| E13 | **MusicStaff** | note pitch = value, sequence = time | series as melody; the visual bridge to future sonification |

## Living & ambient — motion as data (4)

Motion is the encoding, not decoration; all have static reduced-motion equivalents.

| # | Type | Encoding | Use |
|---|---|---|---|
| E14 | **HeartbeatBlip** | spike per event, rate = frequency, flatline = down | service liveness — the most legible alive-signal ever designed |
| E15 | **BreathingDot** | pulse amplitude + rate = continuous load | calm = healthy; ambient system status (discrete events → Heartbeat) |
| E16 | **CometTrail** | dot at now + fading positional trail = recent history | the live sparkline as motion trace |
| E17 | **OrbitStatus** | satellite orbit radius = latency, speed = call rate | dependency health per row — two live variables |

## Spatial & architectural (5)

| # | Type | Encoding | Use |
|---|---|---|---|
| E18 | **PolarClock** | radial segment length per hour/day angle | cyclic patterns — a day's shape in 24 px; genuinely underserved data story |
| E19 | **SpiralYear** | opacity along an Archimedean spiral, one dot/period | a year in a square — seasonality at a glance (NYT-proven technique) |
| E20 | **Honeycomb** | filled hex cells of total | occupancy/capacity (seats, slots) — area-filling semantics, distinct from Pictogram's unit counts |
| E21 | **CitySkyline** | building height = primary, lit windows = secondary | two-variable bar with charm — regions, teams |
| E22 | **BubbleRow** | touching circles, r ∝ √value | magnitude with physicality — **documented low-precision** (area perception); docs steer precision needs to MiniBar |

## Cut ledger (13) — and why

Editorial test failures, each with the specific reason:

| Cut | Reason |
|---|---|
| WeightWord | Weight differences unreadable without a reference; reads as inconsistent typography (a bug), not data. FillWord does "text is chart" legibly. |
| Ripple | Fails read-back — ripple spacing doesn't decode to a value. Decoration, not encoding. |
| MountainRidges | Not a new type — a *styling* of core Stacked-area. Becomes `style="ridge"` variant there. |
| TideLevel | Container-fill = the battery critique we ourselves wrote; Progress + theme covers it. |
| AbacusRow | Requires abacus literacy to read back; Tally + DicePips cover counts universally. |
| CandleBurn | Duplicate of Hourglass's elapsed/remaining story; flame delight didn't justify two. |
| CairnStack | Discrete-progress duplicate of core Pictogram row. |
| QuipuCord | Most seductive culturally, weakest read-back (knot position needs an axis). MiniBar/DotPlot tell it legibly. The khipu nod lives in docs prose, not the catalog. |
| MorseStrip | Duration-strip duplicate of core EventTimeline; Morse framing adds lore, not legibility. |
| BrailleCells | **Actively wrong for an a11y-first brand**: braille is a tactile script — flat on-screen it's illegible to sighted users, useless to blind users, and reads as appropriation of an accessibility medium for decoration. |
| FireflyField | Random positions = visual noise; three ambient-live types was two too many (Heartbeat + BreathingDot cover discrete/continuous). |
| ConfettiBurst | A celebration *moment*, not a chart — nobody counts confetti. **Relocated**: becomes `<Marker celebrate>` in the core annotation layer, where it belongs. |
| StatusPet | The user's instinct was right — it's a mascot, not an encoding; StatusDot says the same with none of the ambiguity, and cutesy-creature UI is AI-slop-adjacent brand risk. **Relocated**: docs "build your own" recipe on top of the JSON spec — the community can have pets; we don't ship one. |

Also consolidated in core: **Lollipop → `stem` prop variant of DotPlot** (we'd already flagged the stem as borderline chartjunk; it never was a separate data story). Core = 34 types.

**Catalog contribution: 22 expressive types** (full catalog: 96 across docs 05/16/15/17), plus 2 relocated features (celebrate marker, ridge style) and 1 docs recipe (pet).

## Honesty & shipping rules (unchanged)

Documented primary channel + precision rating per type · same auto-summary pipeline · same tokens/themes · flagship rollout: MoonPhase, HeartbeatBlip, TreeRings, TallyMarks, PolarClock, CitySkyline, FillWord — then demand-driven.
