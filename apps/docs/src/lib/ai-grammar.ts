/** Chart grammar data — shared by GrammarExplorer and the Markdown transform. */
export interface GrammarType {
  type: string;
  label: string;
  /** One-line "when to use". */
  blurb: string;
  /** Example fenced-block body. */
  body: string;
  /** The equivalent React. */
  jsx: string;
  /** Inline-form host sentence, `{}` marks the chart slot. */
  sentence: string;
}

export const GRAMMAR: GrammarType[] = [
  {
    type: "sparkline",
    label: "Sparkline",
    blurb: "trend over time",
    body: "132 148 141 165 159 182 176 203",
    jsx: `<Sparkline\n  data={[132, 148, 141, 165, 159, 182, 176, 203]}\n  title="Revenue"\n/>`,
    sentence: "Revenue climbed steadily {} through Q3.",
  },
  {
    type: "sparkbar",
    label: "SparkBar",
    blurb: "magnitude per period (signed values = win/loss)",
    body: "6 9 5 11 7 12 8 10",
    jsx: `<SparkBar\n  data={[6, 9, 5, 11, 7, 12, 8, 10]}\n  title="Deploys per day"\n/>`,
    sentence: "Shipping held steady {} all quarter.",
  },
  {
    type: "delta",
    label: "Delta",
    blurb: "one signed change or ratio",
    body: "+0.184",
    jsx: `<Delta value={0.184} title="Week over week" />`,
    sentence: "Week over week that is {}, ahead of plan.",
  },
  {
    type: "bullet",
    label: "Bullet",
    blurb: "a value against a target (value= target= bands=)",
    body: "value=72 target=80 bands=50,90",
    jsx: `<Bullet\n  value={72}\n  target={80}\n  bands={[50, 90]}\n  title="Quota attainment"\n/>`,
    sentence: "We're at {} of the annual quota.",
  },
  {
    type: "activity",
    label: "ActivityGrid",
    blurb: "cadence / intensity over a period",
    body: "0 2 1 3 4 2 1 3 2 4 3 2",
    jsx: `<ActivityGrid\n  data={[0, 2, 1, 3, 4, 2, 1, 3, 2, 4, 3, 2]}\n  layout="strip"\n  title="Commit activity"\n/>`,
    sentence: "Commit activity held steady {} across the team.",
  },
];
