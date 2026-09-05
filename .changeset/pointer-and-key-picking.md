---
"@microcharts/react": patch
---

Fixes five picking and scale bugs. `IconArray`'s keyboard step applied its idle rule ("a first arrow from nothing
focuses unit 0") ahead of the key filter, so the first `Tab` or letter after an idle reset activated unit 0, fired
`onActive`, and swallowed the keystroke. `TimeInRange`'s hit test matched each zone's painted extent and ignored the
separator the geometry lays between them, so a pointer sweep hit a dead band at every boundary and the hover outline,
chip and live region dropped and re-lit; the geometry now reports the separator it actually laid and the hit box
swallows it. `Horizon`'s `foldedY` wrapped past the top fold into a band that is never drawn, teleporting the
interactive dot the height of the strip for a value one epsilon over the ceiling. `niceDomain` dropped the zero anchor
for an all-zero series, so a zero-anchored `Sparkline` fill drew its baseline across the midline instead of the floor.
`CalendarStrip`'s `color` prop skipped zero-valued days, which kept the default accent beside recoloured neighbours.
