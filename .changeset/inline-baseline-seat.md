---
"@microcharts/react": patch
---

Floor charts now seat their baseline flush with the box bottom so they align on the text baseline when rendered inline:
SparkBar (bar mode), StackedArea, DepthWedge, and GradeProfile. These marks are flat fill edges (crispEdges rects /
stroke-free, dot-free areas), so filling to the box bottom bleeds nothing; the top pad is untouched. SparkBar win-loss
keeps its symmetric mid-line inset. No API change.
