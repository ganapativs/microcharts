---
"@microcharts/react": patch
---

BalanceBeam: the lone value label no longer disappears when the other pan holds a non-finite value (NaN, ±Infinity, or
null). The two equivalent spellings of one known value — `[{label, value}]` and `[{label, value}, {label, NaN}]` — now
render the same numeral at every width, restoring the pre-`e406804` symmetry. The both-finite tilt-convergence
separation gate is unchanged.
