/** AI guide code samples as TS strings (MDX fences would strip indent / nest badly). */
export interface Snippet {
  lang: string;
  code: string;
}

export const AI_SNIPPETS: Record<string, Snippet> = {
  parse: {
    lang: "ts",
    code: `const FENCE = /\`\`\`microchart (\\w+)\\n([\\s\\S]*?)\`\`\`/g;
const INLINE = /\`microchart (\\w+) ([^\`]+)\`/g;

const nums = (b: string) => b.split(/[\\s,]+/).map(Number).filter(Number.isFinite);
const kv = (b: string) =>
  Object.fromEntries(
    b.split(/\\s+/).flatMap((t) => {
      const i = t.indexOf("=");
      return i > 0 ? [[t.slice(0, i), t.slice(i + 1)]] : [];
    }),
  );`,
  },

  map: {
    lang: "tsx",
    code: `import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { ActivityGrid } from "@microcharts/react/activity-grid";

export function ChartBlock({ type, body }: { type: string; body: string }) {
  switch (type) {
    case "sparkline": return <Sparkline data={nums(body)} title="Series" />;
    case "sparkbar":  return <SparkBar data={nums(body)} title="Per period" />;
    case "delta":     return <Delta value={Number(body.trim())} title="Change" />;
    case "bullet": {
      const p = kv(body);
      return (
        <Bullet
          value={+p.value}
          target={p.target ? +p.target : undefined}
          bands={p.bands?.split(",").map(Number)}
          title="Attainment"
        />
      );
    }
    case "activity": return <ActivityGrid data={nums(body)} layout="strip" title="Cadence" />;
    default: return null; // unknown type → leave the text as-is
  }
}`,
  },

  systemPrompt: {
    lang: "text",
    code: `When a number series would help, emit a chart block instead of prose.
Fenced for a standalone chart, inline \`microchart …\` for a word-sized one:

\`\`\`microchart sparkline
132 148 141 165 159 182 176 203
\`\`\`

Types: sparkline · sparkbar (signed = win/loss) · delta (one signed ratio)
· bullet (value= target= bands=) · activity (intensities).
Never invent a pie or gauge — they aren't supported.`,
  },

  fewShot: {
    lang: "text",
    code: `User: How did deploys trend this week?
Assistant: Steady, with a strong Thursday:

\`\`\`microchart sparkbar
6 9 5 11 7 12 8 10
\`\`\`

User: And are we on track for the quota?
Assistant: Close — \`microchart delta +0.184\` week over week puts us here:

\`\`\`microchart bullet
value=72 target=80 bands=50,90
\`\`\``,
  },

  structured: {
    lang: "tsx",
    code: `type ChartSpec =
  | { type: "sparkline" | "sparkbar" | "activity"; data: number[]; title?: string }
  | { type: "delta"; value: number; title?: string }
  | { type: "bullet"; value: number; target?: number; bands?: number[]; title?: string };

// model returns ChartSpec (JSON mode / response_format) → render directly
function Chart(spec: ChartSpec) {
  switch (spec.type) {
    case "sparkline": return <Sparkline data={spec.data} title={spec.title} />;
    case "bullet":    return <Bullet {...spec} />;
    // …one arm per type
  }
}`,
  },

  tool: {
    lang: "ts",
    code: `const renderChart = {
  name: "render_chart",
  description: "Render a microchart when a number series helps the reader.",
  input_schema: {
    type: "object",
    required: ["type"],
    properties: {
      type: { enum: ["sparkline", "sparkbar", "delta", "bullet", "activity"] },
      data: { type: "array", items: { type: "number" } },
      value: { type: "number" },
      target: { type: "number" },
      bands: { type: "array", items: { type: "number" } },
      title: { type: "string" },
    },
  },
};
// on tool_use → <Chart {...toolCall.input} />`,
  },

  guardrails: {
    lang: "ts",
    code: `const KNOWN = new Set(["sparkline", "sparkbar", "delta", "bullet", "activity"]);

function safeBlock(type: string, body: string) {
  if (!KNOWN.has(type)) return null;           // unknown type → render raw text
  const data = nums(body);
  if (type !== "delta" && data.length === 0) return null; // no numbers → skip
  return { type, body };                        // charts handle empty/NaN/±∞ already
}`,
  },

  streaming: {
    lang: "tsx",
    code: `// on each streamed chunk:
const nodes = parse(accumulatedText); // text | { type, body, closed }

return nodes.map((n) =>
  n.type === "text" ? <Inline text={n.v} />
  : n.closed        ? <ChartBlock type={n.type} body={n.body} />
  :                   <pre>{n.raw}</pre>, // still streaming → show raw
);`,
  },

  rsc: {
    lang: "tsx",
    code: `import { Sparkline } from "@microcharts/react/sparkline"; // no "use client"

export default async function Answer({ spec }: { spec: ChartSpec }) {
  return <ChartBlock type={spec.type} body={spec.body} />; // pure SVG, server-rendered
}`,
  },

  toolOutput: {
    lang: "tsx",
    code: `{rows.map((r) => (
  <tr key={r.id}>
    <td>{r.name}</td>
    <td><Sparkline data={r.history} summary={false} /></td>
    <td><Bullet value={r.value} target={r.goal} summary={false} /></td>
  </tr>
))}`,
  },

  programmatic: {
    lang: "ts",
    code: `import { renderToStaticMarkup } from "react-dom/server";
import { Sparkline } from "@microcharts/react/sparkline";

const svg = renderToStaticMarkup(<Sparkline data={data} title="Revenue" />);
// → a self-contained <svg> string for anywhere HTML goes`,
  },
};
