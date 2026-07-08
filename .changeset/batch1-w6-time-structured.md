---
"@microcharts/react": minor
---

Batch 1 wave 6 — the two date-structured charts, completing the core-29:

- `CalendarStrip` (`./calendar-strip`) — the last few weeks day by day on a real
  weeks × 7 UTC calendar grid; value days step the shared intensity ramp, zero days
  show the track, no-record days render as outlines (empty ≠ zero), future days are
  blank. 2-D keyboard nav announces real calendar days.
- `EventTimeline` (`./event-timeline`) — spans + point-event diamonds on one linear
  time axis; window clipping is flat-cut honest; coverage merges intervals (overlaps
  never double-count); authored `now` tick.

New core: cached `makeDateFormatter` (UTC-forced for calendar charts) + `EN_CALENDAR`/
`EN_TIMELINE` string modules. `core/calendar` split into `calendar` (day parsing) and
`calendar-grid` (week-grid/year math) so ActivityGrid stops carrying grid math it never
calls. Fixed: `normalizeShares` could emit a negative share when the float remainder
landed on a denormal-tiny entry (property-test counterexample) — remainder now folds
into the largest share.
