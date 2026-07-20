import { MusicStaff } from "@microcharts/react/music-staff";
import type { ChartContexts, ChartEntry, ChartModuleStatic, PlaygroundSpec, Recipe } from "./types";

const PKG = "@microcharts/react";
export const MELODY = [3, 5, 4, 8, 6, 9, 7, 11];

export const entry: ChartEntry = {
  name: "MusicStaff",
  slug: "music-staff",
  status: "stable",
  collection: "expressive",
  tagline: "The shape of a short series, read as a melody.",
  staticImport: `${PKG}/music-staff`,
  interactiveImport: `${PKG}/music-staff/interactive`,
  dataShape: "(number | null)[]",
  encoding: { channel: "pitch (vertical position on a 5-line staff)", precision: "medium" },
  nodeBudget: "n + 2 (n ≤ 16)",
  bestFor: [
    "a weekly-rhythm read in a sentence",
    "the shape of a sprint or short series in a cell",
    "a per-channel melody in a tab",
  ],
  avoidFor: [
    "exact values (Sparkline + label)",
    "long series (> 16 points)",
    "trends where slope matters",
  ],
  props: [
    {
      name: "data",
      type: "(number | null)[]",
      required: true,
      description: "The series; null = a rest.",
    },
    {
      name: "mode",
      type: '"staff" | "ledger"',
      required: false,
      description: "ledger (±2, default) or staff (clamp on-staff).",
    },
    {
      name: "label",
      type: '"none" | "last"',
      required: false,
      description: "Print the final value after the last note.",
    },
  ],
  demo: MELODY,
  example: {
    title: "Sprint melody",
    code: `import { MusicStaff } from "${PKG}/music-staff";\n\n<MusicStaff data={weeks} title="Sprint melody" />`,
  },
  sampleData: [
    {
      name: "weeks",
      code: `const weeks = [3, 5, 4, 8, 6, 9, 7, 11];`,
    },
  ],
};

export function Preview() {
  return <MusicStaff data={MELODY} summary={false} width={80} height={22} />;
}
export const playground: PlaygroundSpec = {
  knobs: [
    {
      kind: "segmented",
      key: "mode",
      label: "mode",
      options: ["ledger", "staff"],
      init: "ledger",
    },
    { kind: "toggle", key: "label", label: "last value", init: false },
  ],
  data: MELODY,
  render: (s, data) => (
    <MusicStaff
      data={data}
      mode={s.mode as "ledger" | "staff"}
      label={s.label ? "last" : "none"}
      summary={false}
      width={220}
      height={40}
    />
  ),
  code: (s) =>
    [
      "<MusicStaff",
      "  data={weeks}",
      s.mode !== "ledger" && `  mode="${s.mode}"`,
      s.label && '  label="last"',
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
  interactiveHint:
    "Hover or arrow ←/→ across the notes — each announces its position and value, like stepping through a melody.",
};

export const recipes: Recipe[] = [
  {
    label: "staff mode clamps the pitch on-staff",
    code: `<MusicStaff data={weeks} mode="staff" />`,
    node: <MusicStaff data={MELODY} mode="staff" summary={false} width={120} height={24} />,
  },
  {
    label: "a rest (null) leaves a gap",
    code: `<MusicStaff data={[3, 5, null, 8, 6]} />`,
    node: <MusicStaff data={[3, 5, null, 8, 6]} summary={false} width={90} height={22} />,
  },
];

const TEAMS = [
  { name: "Platform", data: MELODY, meta: "peak 11" },
  { name: "Core", data: [2, 4, 3, 6, 5, 7, 6, 9], meta: "peak 9" },
  { name: "Web", data: [4, 3, 5, 4, 6, 5, 8, 7], meta: "peak 8" },
];

export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Sprint velocity this cycle{" "}
        <span className="mc-inline">
          <MusicStaff data={MELODY} summary={false} width={90} height={20} />
        </span>{" "}
        — peaked in week 4, closing at 11 story points.
      </p>
    ),
    code: "<p>\n  Sprint velocity <MusicStaff data={weeks} width={90} height={20} /> — peaked week 4.\n</p>",
  },
  cell: {
    render: () => (
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-fd-border/60">
          {TEAMS.map((t) => (
            <tr key={t.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{t.name}</td>
              <td className="py-1.5">
                <MusicStaff data={t.data} summary={false} width={72} height={18} />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{t.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: "<td><MusicStaff data={team.weeks} width={72} height={18} /></td>",
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Sprint melody</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">11</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">peak story points, week 4</span>
          </div>
        </div>
        <MusicStaff data={MELODY} summary={false} width={200} height={28} />
      </>
    ),
    code: '<div className="kpi"><span className="figure">11</span><MusicStaff data={weeks} width={200} height={28} /></div>',
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {TEAMS.map((t, i) => (
          <span
            key={t.name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${i === 0 ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground" : "border-fd-border text-fd-muted-foreground"}`}
          >
            {t.name}
            <MusicStaff data={t.data} summary={false} width={72} height={20} />
          </span>
        ))}
      </div>
    ),
    code: '<button className="tab">Platform <MusicStaff data={weeks} width={72} height={20} /></button>',
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <MusicStaff
      data={props.data.length ? props.data.slice(0, 8) : MELODY}
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 20}
    />
  );
}

export function markCode(): string {
  return `<MusicStaff data={weeks} />`;
}
export default {
  entry,
  Preview,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModuleStatic;
