---
"@microcharts/react": patch
---

Replaces the announce-on-change and pulse-on-change effects with two shared hooks, `useAnnounceOnChange` and
`usePulseOnChange`. Fourteen interactive charts each kept their own `useRef` + `useEffect` that called `setState`
synchronously, which costs a second render — and a committed intermediate frame — on every value change. Both hooks
derive the state during render instead, so React re-runs the component before committing and the intermediate frame
never happens. Announcement semantics are unchanged: still silent on mount, still quiet while `live` is false, still
keyed on the same value per chart.

`usePrefersReducedMotion` now reads `matchMedia` through `useSyncExternalStore`. It used to seed `false` and correct
itself in a mount effect, so a reader who asked for reduced motion got one committed frame of the animated state first.
