// By-design craft exemptions, shared by the craft gate and the readable-floor
// probe so both agree on what counts as a real collision.

// BY-DESIGN exemptions: EventTimeline span labels render CENTERED INSIDE their
// span rects.
export const ALLOWED = (line) =>
  /^event-timeline .*TEXT-ON-MARK "(Freeze|Healthy|[^"]*)" over rect/.test(line) ||
  // TraceFold spans + PartitionStrip segments label INSIDE their rects with
  // on-fill ink — the rect is the label's home. (Previously
  // invisible to the gate via a data-mc-ink="band" attr the superaudit removed
  // as a role misuse.)
  /^(trace-fold|partition-strip) .*TEXT-ON-MARK "[^"]*" over rect/.test(line) ||
  // TimeInRange zone percents render CENTERED INSIDE their zone rects with
  // on-fill ink — the rect is the label's home.
  /^time-in-range .*TEXT-ON-MARK "\d+%" over rect/.test(line) ||
  // SegmentedBar segment percents/values render CENTERED INSIDE their segment
  // rects with on-fill ink — same in-mark encoding as TimeInRange / PartitionStrip.
  /^segmented-bar .*TEXT-ON-MARK "[^"]*" over rect/.test(line) ||
  // FillWord stacks an accent copy of the word ON the muted base — that exact
  // same-word overlap IS the "label is the bar" encoding, not a collision.
  /^fill-word .*TEXT-TEXT "([^"]+)" × "\1"$/.test(line) ||
  // The "NN%" hugs the word using its REAL extent (~0.56 em/char); the craft
  // 0.62 over-estimate reads a phantom overlap that the browser sweep disproves.
  /^fill-word .*TEXT-TEXT "[^"]+" × "\d+%"$/.test(line);
