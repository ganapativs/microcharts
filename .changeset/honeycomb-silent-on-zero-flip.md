---
"@microcharts/react": patch
---

Interactive `<Honeycomb>` announced a redundant `aria-live` count when its `value` flipped between `0` and `-0` — a
transition whose painted comb and summary string are identical ("0 of N seats filled."). The announce now keys on the
same `resolveValue` the comb, chip, and summary already use, so the live region stays quiet until the count the reader
perceives actually moves. The `value={NaN}` mount-silence from the shared `useAnnounceOnChange` hook is preserved.
