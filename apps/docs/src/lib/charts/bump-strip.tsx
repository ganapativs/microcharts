import { BumpStrip } from "@microcharts/react/bump-strip";
import { InteractiveDemo } from "./bump-strip.client";
import type { ChartContexts, ChartEntry, ChartModule, PlaygroundSpec, Recipe } from "./types";

export { InteractiveDemo };

const PKG = "@microcharts/react";
const RANKS = [5, 5, 4, 4, 4, 3, 2, 2, 3, 2, 1, 1];
// Second category, for the tab home — a product that's quietly slipping in Tea
// while Coffee (RANKS) climbs, so the two tabs read as genuinely different stories.
const TEA_RANKS = [2, 3, 3, 4, 4, 5, 5, 6, 5, 6, 7, 7];
// A Coffee bestseller board, for the cell home — our blend plus two competitors
// on the same 12-week window, so the leaderboard reads as one real ranked list.
const LEADERBOARD: { name: string; ranks: (number | null)[] }[] = [
  { name: "Our Blend", ranks: RANKS },
  { name: "Sunrise Roast", ranks: [3, 3, 4, 4, 3, 3, 2, 3, 4, 4, 5, 5] },
  { name: "Cloud Nine", ranks: [1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 6, 6] },
];

export const entry: ChartEntry = {
  name: "BumpStrip",
  slug: "bump-strip",
  status: "stable",
  collection: "core",
  tagline: "Where do we rank, and which way is it moving.",
  staticImport: `${PKG}/bump-strip`,
  interactiveImport: `${PKG}/bump-strip/interactive`,
  dataShape: "(number | null)[] of 1-based ranks per period (null = unranked)",
  encoding: {
    channel: "vertical position on an inverted rank scale (#1 on top)",
    precision: "medium — end labels give the exact ranks; steps are ordinal",
  },
  nodeBudget: "≤ 10 (1 path + change dots + 2 end labels)",
  bestFor: ["leaderboard rows", "category-rank trends in KPI cards"],
  avoidFor: ["continuous values (Sparkline)", "more than ~15 rank levels"],
  props: [
    {
      name: "data",
      type: "(number | null)[]",
      required: true,
      description: "1-based integer ranks; null = unranked period (gap).",
    },
    {
      name: "maxRank",
      type: "number",
      required: false,
      description: "Fix the band so small multiples share a rank scale.",
    },
    {
      name: "dots",
      type: '"changes" | "none"',
      required: false,
      description: "Mark the moments rank actually moved.",
    },
    {
      name: "label",
      type: '"ends" | "last" | "none"',
      required: false,
      description: '"#5" → "#1" endpoint labels.',
    },
  ],
  demo: RANKS.map((r) => 6 - r),
  example: {
    title: "Category rank",
    code: `import { BumpStrip } from "${PKG}/bump-strip";\n\n<BumpStrip data={weeklyRanks} title="Category rank" />`,
  },
  sampleData: [
    {
      name: "weeklyRanks",
      code: `const weeklyRanks = [5, 5, 4, 4, 4, 3, 2, 2, 3, 2, 1, 1]; // #5 -> #1 over 12 weeks`,
    },
  ],
};

export function Preview() {
  return <BumpStrip data={RANKS} summary={false} width={130} height={20} />;
}

export const showcase = {
  hint: "rank",
  Node: () => <BumpStrip data={RANKS} title="Category rank" width={130} height={20} />,
};

export const playground: PlaygroundSpec = {
  // data is the fixed demo series; title/summary/id/className/style/children/strings
  // are chrome, not interactive knobs; color is styling-only (no catalog chart
  // exposes raw color as a knob).
  knobs: [
    {
      kind: "segmented",
      key: "label",
      label: "labels",
      options: ["ends", "last", "none"],
      init: "ends",
    },
    {
      kind: "segmented",
      key: "dots",
      label: "dots",
      options: ["changes", "none"],
      init: "changes",
    },
    { kind: "range", key: "maxRank", label: "max rank", min: 5, max: 12, step: 1, init: 5 },
  ],
  render: (s) => (
    <BumpStrip
      data={RANKS}
      label={s.label as "ends" | "last" | "none"}
      dots={s.dots as "changes" | "none"}
      maxRank={(s.maxRank as number) === 5 ? undefined : (s.maxRank as number)}
      summary={false}
      width={260}
      height={28}
    />
  ),
  code: (s) =>
    [
      "<BumpStrip",
      "  data={weeklyRanks}",
      s.label !== "ends" && `  label="${s.label}"`,
      s.dots !== "changes" && `  dots="${s.dots}"`,
      s.maxRank !== 5 && `  maxRank={${s.maxRank}}`,
      "/>",
    ]
      .filter(Boolean)
      .join("\n"),
};

export const recipes: Recipe[] = [
  {
    label: "leaderboard rows",
    code: `{products.map((p) => (\n  <BumpStrip key={p.id} data={p.ranks} maxRank={10} title={p.name} />\n))}`,
    node: <BumpStrip data={RANKS} maxRank={10} summary={false} width={160} height={16} />,
  },
  {
    label: "gaps for unranked weeks",
    code: `<BumpStrip data={[2, null, null, 3, 1, 1]} />`,
    node: <BumpStrip data={[2, null, null, 3, 1, 1]} summary={false} width={120} height={16} />,
  },
];

/* The four homes — BumpStrip always doing the one thing it's for: where does
   this rank, and which way is it moving. Every host is a real ranked-position
   surface (bestseller category, competitor board), never a generic KPI template. */
export const contexts: ChartContexts = {
  sentence: {
    render: () => (
      <p className="text-[0.95rem] leading-relaxed text-fd-foreground">
        Our blend&apos;s Coffee bestseller rank{" "}
        <span className="mx-1 inline-flex align-middle">
          <BumpStrip data={RANKS} summary={false} width={70} height={16} />
        </span>{" "}
        — from #5 to #1 in twelve weeks.
      </p>
    ),
    code: `<p>\n  Our blend's Coffee bestseller rank{" "}\n  <BumpStrip data={weeklyRanks} width={70} height={16} /> — from #5 to #1 in twelve weeks.\n</p>`,
  },
  cell: {
    render: () => (
      <table className="w-full text-sm tabular-nums">
        <tbody>
          {LEADERBOARD.map((row) => (
            <tr key={row.name} className="border-t border-fd-border/60 first:border-0">
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{row.name}</td>
              <td className="py-1.5">
                <BumpStrip
                  data={row.ranks}
                  label="last"
                  dots="none"
                  summary={false}
                  width={70}
                  height={16}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    code: `<td>\n  <BumpStrip data={[3, 3, 4, 4, 3, 3, 2, 3, 4, 4, 5, 5]} label="last" dots="none" width={70} height={16} />\n</td>`,
  },
  kpi: {
    render: () => (
      <>
        <div>
          <div className="text-fd-muted-foreground text-xs">Coffee category rank</div>
          <div className="flex items-end gap-2">
            <span className="display text-3xl tabular-nums">#1</span>
            <span className="mb-1 text-fd-muted-foreground text-xs">up from #5, 12 weeks ago</span>
          </div>
        </div>
        <BumpStrip data={RANKS} summary={false} width={90} height={24} />
      </>
    ),
    code: `<div className="kpi">\n  <span className="figure">#1</span>\n  <span className="unit">up from #5, 12 weeks ago</span>\n  <BumpStrip data={weeklyRanks} width={90} height={24} />\n</div>`,
  },
  tab: {
    render: () => (
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ["Coffee", RANKS],
            ["Tea", TEA_RANKS],
          ] as const
        ).map(([name, ranks], i) => (
          <span
            key={name}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm ${
              i === 0
                ? "border-fd-primary/40 bg-fd-primary/5 text-fd-foreground"
                : "border-fd-border text-fd-muted-foreground"
            }`}
          >
            {name}
            <BumpStrip
              data={ranks}
              label="none"
              dots="none"
              summary={false}
              width={40}
              height={14}
            />
          </span>
        ))}
      </div>
    ),
    code: `<button className="tab">\n  Coffee <BumpStrip data={weeklyRanks} label="none" width={40} height={14} />\n</button>`,
  },
};

export function Mark(props: { data: number[]; width?: number; height?: number }) {
  return (
    <BumpStrip
      data={props.data.map((v) => (Math.abs(Math.round(v)) % 8) + 1)}
      label="none"
      summary={false}
      width={props.width ?? 60}
      height={props.height ?? 12}
    />
  );
}

export function markCode(): string {
  return `<BumpStrip data={weeklyRanks} />`;
}

export default {
  entry,
  Preview,
  showcase,
  InteractiveDemo,
  playground,
  recipes,
  contexts,
  Mark,
  markCode,
} satisfies ChartModule;
