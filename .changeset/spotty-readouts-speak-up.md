---
"@microcharts/react": minor
---

Every interactive chart now shows the reading it already announces.

Three pickers — `CometTrail`, `IconArray`, `PictogramRow` — lit a hover ring and announced the unit through their live
region but painted no readout chip, so a sighted mouse reader got strictly less than a screen-reader user (and less than
the documented interaction contract promised). They now paint the chip every other picker does, and `IconArray` finally
supplies `datum.formatted`, so its `readout={false}` escape hatch has a string to render.

`EtaBar`'s chip was wired to focus only — hovering the bar with a mouse revealed nothing. It now reveals on hover as
well as focus, like every other reveal-on-hover scalar.

Nine more charts reveal a reading that used to be unreachable with a pointer: `Progress`, `ProgressRing`, `Hourglass`,
`BreathingDot`, `HeartbeatBlip`, `FillWord` and `TapeGauge` float their number on hover/focus whenever the mark isn't
already printing it (`label="none"`, or a gauge too small for its numeral); `MinimapStrip` floats the window range it
was only reporting through `aria-valuetext`; and `TokenConfidence` floats a flagged token's tier and confidence.

Empty units read out instead of going silent: `DotPlot`, `MiniBar`, `PairedBars` and `Funnel` show an em dash for a unit
with no value — matching `ActivityGrid`, `CalendarStrip`, `RubricStrip` and `StarSpoke` — rather than rendering nothing
while the live region announced "no data". Their `datum.formatted` mirrors the chip, per the shared contract.

New string tokens (English defaults ship; a custom `strings` bundle can translate them): `iconArrayChip`,
`pictogramChip`, `tokenChip`, `heartbeatChip`. `PictogramRow`'s `datum.formatted` now mirrors its chip
(`"6 of 8 — 40%"`) rather than the bare percentage.

Chip text is the shortest _useful_ reading — never a duplicate of a permanent `label` already on the glyph. Bare counts
name their unit (`HeartbeatBlip` → `"3 events"`); `BreathingDot` adds the load band the pulse encodes
(`"62% · elevated"`); `EtaBar` floats only what the gutter is not already printing; `Bullet` with `label="both"` floats
only the signed gap. `OrbitStatus` / `Thermometer` / `HeatCell` suppress the chip when their permanent label already
shows the same number.

`readout={false}` suppresses each of these chips and nothing else (playground exposes it for every chip chart), and a
new `readout-presence` gate fails the build if an interactive chart ships a picker or a hover reveal without one.
