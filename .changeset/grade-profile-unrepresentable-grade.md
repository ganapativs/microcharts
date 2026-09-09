---
"@microcharts/react": patch
---

`GradeProfile` readout fabricated a `0%` grade for a pitch whose `rise/run` overflows to `Infinity` (sub-normal run),
announcing `"0%, N gained."` — the exact string a real flat pitch renders, beside a non-zero climb. Screen-reader users,
who get only the live region (no painted bin/ink to disambiguate), had no signal the grade was the documented
placeholder rather than a genuine flat. The grade slot now substitutes a sentence-internal `gradeProfileUnrepresentable`
token ("unrepresentable"), keeping `dEnd` and `cumGain` announced as-painted. Adds `gradeProfileUnrepresentable` to
`SummaryStrings` (sentence-internal, no terminal punctuation so it never collides with the `gradeProfileAt` template's
commas).
