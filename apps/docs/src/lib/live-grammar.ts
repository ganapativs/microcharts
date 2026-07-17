// The live-hero grammar: the tiny chart notation Gemini Nano is taught in the
// hero's on-device demo, plus the incremental parser that turns its streamed
// reply into render-ready segments. Pure and React-free so the node project
// can test it hard; the vignette maps specs → components.
//
// Design constraints (why this isn't a markdown parser):
// - It must be safe to run on EVERY streamed chunk — a half-open backtick or
//   fence is a first-class "in flight" state, rendered as typed raw grammar.
// - A small on-device model WILL mangle syntax sometimes. Anything that fails
//   validation stays visible as literal code text — never a broken chart,
//   never invented data.

export type ChartSpec =
  | { type: "sparkline" | "sparkbar" | "rug-strip"; values: number[] }
  | { type: "delta" | "trend-arrow"; value: number }
  | { type: "bullet"; value: number; target?: number; bands?: number[] }
  | { type: "status-dot"; status: "ok" | "warn" | "error" | "off" | "busy" }
  | {
      type: "mini-bar" | "segmented";
      title: string;
      items: { label: string; value: number }[];
    }
  | { type: "histogram" | "seismogram"; title: string; values: number[] };

export type LiveSeg =
  | { kind: "text"; text: string }
  /** Inline code that isn't chart grammar — rendered as literal code. */
  | { kind: "code"; text: string }
  | {
      kind: "chart";
      /** The raw grammar including its backticks/fence — what streams as type. */
      raw: string;
      block: boolean;
      /** false while the closing backtick/fence hasn't arrived yet. */
      complete: boolean;
      /** null = complete but invalid → render `raw` as code, honestly. */
      spec: ChartSpec | null;
    };

const STATUSES = new Set(["ok", "warn", "error", "off", "busy"]);
const MAX_POINTS = 24;
const MAX_BLOCK_POINTS = 40;
const MAX_ITEMS = 8;

/** Parse one numeric token; tolerates `+`, `$`, `%`, thousands commas, and a
 *  trailing period. Returns null for anything else (strict — see file note). */
function num(tok: string): number | null {
  const cleaned = tok.replace(/[,$%()]/g, "").replace(/\.$/, "");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
  const v = Number(cleaned);
  return Number.isFinite(v) && Math.abs(v) < 1e9 ? v : null;
}

function series(toks: string[], min: number, max: number): number[] | null {
  if (toks.length < min) return null;
  const out: number[] = [];
  for (const t of toks.slice(0, max)) {
    const v = num(t);
    if (v === null) return null;
    out.push(v);
  }
  return out;
}

/** Delta/trend values are fractions (0.18 → “+18%”). Small models often emit
 *  the percent number instead; |v| > 1.5 is read as one — never a 1200% lie. */
function fraction(tok: string): number | null {
  const v = num(tok);
  if (v === null) return null;
  const f = Math.abs(v) > 1.5 ? v / 100 : v;
  return Math.abs(f) <= 10 ? f : null;
}

function cleanTitle(s: string): string {
  return s.replace(/[`*_]/g, "").trim().slice(0, 40);
}

/** `chart <type> <args>` — the inline (single-backtick) forms. */
function parseInline(body: string): ChartSpec | null {
  const toks = body.trim().split(/\s+/);
  if (toks[0] !== "chart" || toks.length < 3) return null;
  const type = toks[1];
  const rest = toks.slice(2);
  switch (type) {
    case "sparkline":
    case "sparkbar":
    case "rug-strip": {
      const values = series(rest, 3, MAX_POINTS);
      return values ? { type, values } : null;
    }
    case "delta":
    case "trend-arrow": {
      const value = fraction(rest[0]);
      return value === null ? null : { type, value };
    }
    case "bullet": {
      let value: number | null = null;
      let target: number | undefined;
      let bands: number[] | undefined;
      for (const t of rest) {
        const m = /^(value|target|bands)=(.+)$/.exec(t);
        if (!m) continue;
        if (m[1] === "bands") {
          const b = series(m[2].split(","), 2, 2);
          if (b) bands = b;
        } else {
          const v = num(m[2]);
          if (v === null) return null;
          if (m[1] === "value") value = v;
          else target = v;
        }
      }
      if (value === null) return null;
      return { type, value, ...(target !== undefined && { target }), ...(bands && { bands }) };
    }
    case "status-dot": {
      const status = rest[0].toLowerCase();
      return STATUSES.has(status)
        ? { type, status: status as "ok" | "warn" | "error" | "off" | "busy" }
        : null;
    }
    default:
      return null;
  }
}

/** ```chart <type> <title>\n<data lines>\n``` — the block (fenced) forms. */
function parseFence(inner: string): ChartSpec | null {
  const lines = inner.trim().split("\n");
  const head = lines[0].trim().split(/\s+/);
  if (head[0] !== "chart" || head.length < 2) return null;
  const type = head[1];
  const title = cleanTitle(head.slice(2).join(" "));
  const body = lines.slice(1).filter((l) => l.trim() !== "");
  switch (type) {
    case "mini-bar":
    case "segmented": {
      if (body.length < 2) return null;
      const items: { label: string; value: number }[] = [];
      for (const line of body.slice(0, MAX_ITEMS)) {
        const toks = line.trim().split(/\s+/);
        if (toks.length < 2) return null;
        const value = num(toks[toks.length - 1]);
        if (value === null) return null;
        const label = cleanTitle(toks.slice(0, -1).join(" ")).slice(0, 16);
        if (!label) return null;
        items.push({ label, value });
      }
      return { type, title, items };
    }
    case "histogram":
    case "seismogram": {
      const values = series(body.join(" ").trim().split(/\s+/), 4, MAX_BLOCK_POINTS);
      return values ? { type, title, values } : null;
    }
    default:
      return null;
  }
}

/** Strip the markdown a small model can't resist (bold, headings) and collapse
 *  runaway blank lines — the reply body renders with `whitespace-pre-wrap`. */
function sanitize(text: string): string {
  return text
    .replace(/\*\*|__/g, "")
    .replace(/^#{1,4}\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Parse an accumulated (possibly still-streaming) reply into segments. Called
 * with the FULL text so far on every chunk; a trailing unterminated backtick
 * or fence yields an in-flight chart segment (`complete: false`).
 */
export function parseLiveReply(input: string): LiveSeg[] {
  const segs: LiveSeg[] = [];
  let text = "";
  let i = 0;
  const flush = () => {
    if (text) {
      segs.push({ kind: "text", text: sanitize(text) });
      text = "";
    }
  };
  while (i < input.length) {
    if (input.startsWith("```", i)) {
      flush();
      const end = input.indexOf("```", i + 3);
      const complete = end !== -1;
      const inner = complete ? input.slice(i + 3, end) : input.slice(i + 3);
      const raw = complete ? input.slice(i, end + 3) : input.slice(i);
      if (complete && !inner.trimStart().startsWith("chart")) {
        segs.push({ kind: "code", text: inner.trim() });
      } else {
        segs.push({
          kind: "chart",
          raw,
          block: true,
          complete,
          spec: complete ? parseFence(inner) : null,
        });
      }
      i = complete ? end + 3 : input.length;
    } else if (input[i] === "`") {
      flush();
      const end = input.indexOf("`", i + 1);
      const complete = end !== -1;
      const inner = complete ? input.slice(i + 1, end) : input.slice(i + 1);
      const raw = complete ? input.slice(i, end + 1) : input.slice(i);
      if (complete && !inner.trimStart().startsWith("chart ")) {
        segs.push({ kind: "code", text: inner });
      } else {
        segs.push({
          kind: "chart",
          raw,
          block: false,
          complete,
          spec: complete ? parseInline(inner) : null,
        });
      }
      i = complete ? end + 1 : input.length;
    } else {
      text += input[i];
      i++;
    }
  }
  flush();
  // Block charts render as block-level elements with their own margin. The
  // newlines that merely separated the fence from its surrounding prose would
  // each paint as a blank line under `whitespace-pre-wrap` — trim them so the
  // block's margin is the only spacing.
  for (let s = 0; s < segs.length; s++) {
    const seg = segs[s];
    if (seg.kind !== "chart" || !seg.block) continue;
    const prev = segs[s - 1];
    const next = segs[s + 1];
    if (prev?.kind === "text") prev.text = prev.text.replace(/[ \t]*\n\s*$/, "");
    if (next?.kind === "text") next.text = next.text.replace(/^[ \t]*\n\s*/, "");
  }
  return segs.filter((seg) => seg.kind !== "text" || seg.text !== "");
}

// ---------------------------------------------------------------------------
// The prompt. Kept beside the parser so a test can assert every chart in the
// few-shot examples round-trips through parseLiveReply with a valid spec —
// the model is never shown grammar we can't render.
// ---------------------------------------------------------------------------

export const LIVE_SYSTEM_PROMPT = `You are a sharp, concise data analyst. Answer in 50–100 words of plain prose. No headings, no bullet lists, no bold.
Weave 3–5 tiny charts into your sentences using EXACTLY this syntax:
\`chart sparkline 132 148 141 165 182\` — a trend, 4–16 numbers
\`chart sparkbar 12 18 9 22 30\` — bars, 4–16 numbers
\`chart delta +0.18\` — change, as a signed fraction
\`chart trend-arrow -0.05\` — direction, as a signed fraction
\`chart bullet value=72 target=80 bands=50,90\` — progress vs target
\`chart status-dot ok\` — one of: ok, warn, error, off, busy
Exactly one standalone chart, fenced on its own lines, where the breakdown carries the story:
\`\`\`chart mini-bar Net-new by region ($k)
NA 48
EU 39
UK 27
\`\`\`
(also \`\`\`chart segmented <title> with the same label-value lines for a share-of-total mix, or \`\`\`chart histogram <title> / \`\`\`chart seismogram <title> with one line of numbers under it)
Pair charts so they build on each other: a trend with its delta, a spike with the status it caused, a total with its breakdown. Invent plausible, internally consistent numbers. Never explain the syntax or mention charts.`;

export const LIVE_FEW_SHOTS: { role: "user" | "assistant"; content: string }[] = [
  { role: "user", content: "Recap Q3 revenue for the board" },
  {
    role: "assistant",
    content:
      "Q3 landed 12% ahead of plan. Revenue built week over week `chart sparkline 132 148 141 165 159 182 176 203`, up `chart delta +0.184` on Q2, and growth was broad, not one deal carrying it:\n```chart mini-bar Net-new by region ($k)\nNA 48\nEU 39\nUK 27\nAPAC 22\nLATAM 18\n```\nPipeline sits `chart bullet value=72 target=80 bands=50,90` to target, our sixth straight beat. A clean quarter, clear to raise for Q4.",
  },
  { role: "user", content: "Did last night's deploy hurt latency?" },
  {
    role: "assistant",
    content:
      "Briefly, yes. p95 held near 180 ms `chart sparkline 178 181 176 183 179 240 212 184` until the 02:10 deploy pushed it up `chart delta +0.31` for twenty minutes:\n```chart seismogram Slow requests per minute\n2 1 2 3 19 26 14 6 3 2 1 2\n```\nRollback landed at 02:31 `chart status-dot warn`, and by morning we were back inside budget `chart bullet value=91 target=100 bands=80,110`. Adding a latency gate to the canary.",
  },
  { role: "user", content: "How did NVDA trade today?" },
  {
    role: "assistant",
    content:
      "NVDA closed +3.8% `chart trend-arrow +0.038`, climbing steadily into the bell `chart sparkline 100 101 102 104 103 105 107 109`. Volume skewed to the open and the close `chart sparkbar 42 28 19 15 14 18 26 38`, and intraday returns stayed tight, no fat tails:\n```chart histogram 1-min returns (bps)\n-2 -1 0 1 -1 2 1 0 3 1 -1 0 2 1 4 -2 1 0\n```\nThe desk sits `chart delta +0.021` over benchmark weight going into tomorrow.",
  },
  { role: "user", content: "Break down our traffic mix this week" },
  {
    role: "assistant",
    content:
      "Sessions grew steadily `chart sparkline 4200 4390 4310 4580 4720 4950 5210`, up `chart delta +0.11` on last week, and the mix stayed healthy rather than paid-heavy:\n```chart segmented Sessions by source\nOrganic 46\nPaid 24\nReferral 16\nEmail 9\nSocial 5\n```\nOrganic has led for nine straight weeks, and conversion held `chart status-dot ok` through the growth.",
  },
];

export const LIVE_SAMPLES = [
  "Recap Q3 revenue for the board",
  "Did last night's deploy hurt latency?",
  "How did NVDA trade today?",
  "Break down our traffic mix this week",
];
