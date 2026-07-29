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
//
// `describeSeries` (core, React-free) is reused for the spoken form below.

import { describeSeries } from "@microcharts/react";

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

/** Every type the grammar knows, in either form. Used to tell "the model wrote
 *  a chart tag we could not fill in" from "the model wrote some other code". */
const KNOWN_TYPES = new Set([
  "sparkline",
  "sparkbar",
  "rug-strip",
  "delta",
  "trend-arrow",
  "bullet",
  "status-dot",
  "mini-bar",
  "segmented",
  "histogram",
  "seismogram",
]);

/** Split a token run into a leading title and the trailing numbers.
 *
 *  Small models put a title where the grammar wants numbers —
 *  `microchart sparkline Weekly signups 12 18 9` — so the numbers are taken
 *  from the END and whatever preceded them becomes the title. */
function titleAndSeries(rest: string[]): { title: string; values: number[] } {
  let i = rest.length;
  const values: number[] = [];
  while (i > 0) {
    const v = num(rest[i - 1]!);
    if (v === null) break;
    values.unshift(v);
    i -= 1;
  }
  return { title: cleanTitle(rest.slice(0, i).join(" ")), values };
}

/** `LABEL VALUE LABEL VALUE …` on one line — a categorical body a model wrote
 *  inline instead of across fenced lines. Anything before the first pair is the
 *  title. */
function titleAndItems(rest: string[]): {
  title: string;
  items: { label: string; value: number }[];
} {
  const items: { label: string; value: number }[] = [];
  let titleEnd = rest.length;
  for (let i = 0; i < rest.length - 1; i += 1) {
    if (num(rest[i]!) !== null) continue;
    const value = num(rest[i + 1]!);
    if (value === null) continue;
    if (items.length === 0) titleEnd = i;
    items.push({ label: cleanTitle(rest[i]!).slice(0, 16), value });
    i += 1;
  }
  return { title: cleanTitle(rest.slice(0, titleEnd).join(" ")), items: items.slice(0, MAX_ITEMS) };
}

/**
 * `microchart <type> <args>` — the inline (single-backtick) forms.
 *
 * Deliberately forgiving in one direction only. A model reaches for single
 * backticks even when the type is fence-only (measured: it is the single most
 * common thing Nano gets wrong), so a block type found inline is promoted to its
 * block spec IF it carries enough data to draw. What is never done is inventing
 * data — a tag with a title and nothing else still fails, and the caller drops it.
 */
function parseInline(body: string): ChartSpec | null {
  const toks = body.trim().split(/\s+/);
  if (toks[0] !== "microchart" || toks.length < 3) return null;
  const type = toks[1];
  const rest = toks.slice(2);
  switch (type) {
    case "sparkline":
    case "sparkbar":
    case "rug-strip": {
      const { values } = titleAndSeries(rest);
      return values.length >= 3 ? { type, values: values.slice(0, MAX_POINTS) } : null;
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
    // Fence-only types, written inline. Promoted when the data is there.
    case "histogram":
    case "seismogram": {
      const { title, values } = titleAndSeries(rest);
      return values.length >= 4 ? { type, title, values: values.slice(0, MAX_BLOCK_POINTS) } : null;
    }
    case "mini-bar":
    case "segmented": {
      const { title, items } = titleAndItems(rest);
      return items.length >= 2 ? { type, title, items } : null;
    }
    default:
      return null;
  }
}

/** ```microchart <type> <title>\n<data lines>\n``` — the block (fenced) forms. */
function parseFence(inner: string): ChartSpec | null {
  const lines = inner.trim().split("\n");
  const head = lines[0].trim().split(/\s+/);
  if (head[0] !== "microchart" || head.length < 2) return null;
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
    // The mirror of the inline case: a model that has just written three fenced
    // charts will fence the fourth one too, whatever its type. Re-read the block
    // as if it had been written inline — the title is already off the front, so
    // the body carries the args.
    default:
      return KNOWN_TYPES.has(type)
        ? parseInline(`microchart ${type} ${body.join(" ").trim()}`)
        : null;
  }
}

/** Specs that lay out as a standalone block, whichever form they were written in. */
const BLOCK_SPECS = new Set(["mini-bar", "segmented", "histogram", "seismogram"]);

/** Types whose entire content is a series or a breakdown. Written with a title
 *  and no numbers there is nothing to draw AND nothing to show — which is the
 *  one case worth dropping rather than printing. A wrong `status-dot` state or a
 *  malformed `delta` is one short token, so those stay visible and honest. */
const NEEDS_DATA = new Set([
  "sparkline",
  "sparkbar",
  "rug-strip",
  "histogram",
  "seismogram",
  "mini-bar",
  "segmented",
]);

/** `microchart <series type> <words>` — a tag with no number anywhere in it. */
function isEmptyTag(inner: string): boolean {
  const toks = inner.trim().split(/\s+/);
  if (toks[0] !== "microchart" || !NEEDS_DATA.has(toks[1] ?? "")) return false;
  return !toks.slice(2).some((tok) => num(tok) !== null);
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
      if (complete && !inner.trimStart().startsWith("microchart")) {
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
      if (complete && !inner.trimStart().startsWith("microchart ")) {
        segs.push({ kind: "code", text: inner });
      } else {
        const spec = complete ? parseInline(inner) : null;
        // A tag the parser recognises but cannot fill — `microchart seismogram
        // Drop-off by step` with no numbers after it — is dropped, not printed.
        // There is nothing to draw and nothing a reader gains from seeing the
        // grammar; the sentence around it still reads. Everything else that
        // fails validation stays visible as literal code, as it always has.
        if (complete && !spec && isEmptyTag(inner)) {
          i = end + 1;
          continue;
        }
        segs.push({
          kind: "chart",
          raw,
          // A block type written inline still lays out as a block.
          block: spec ? BLOCK_SPECS.has(spec.type) : false,
          complete,
          spec,
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
// Spoken form. The hero's live reply is a real interaction (a person asks, the
// model answers), so a screen reader must hear the answer — not the chart
// grammar. This flattens a finished reply into one plain sentence: prose stays
// verbatim, each chart becomes the same natural-language summary the chart
// itself would carry (`describeSeries` for series marks). Pure + React-free so
// the node test can pin it; announced once on completion, never per chunk.

function speakSpec(spec: ChartSpec): string {
  switch (spec.type) {
    case "sparkline":
    case "sparkbar":
    case "rug-strip":
      return describeSeries(spec.values);
    case "histogram":
    case "seismogram":
      return `${spec.title}: ${describeSeries(spec.values)}`;
    case "delta":
    case "trend-arrow": {
      // The parser normalizes value to a fraction (see the delta test), so the
      // percent is safe to speak alongside the direction.
      if (spec.value === 0) return "flat";
      const dir = spec.value > 0 ? "up" : "down";
      return `${dir} ${Math.round(Math.abs(spec.value) * 100)}%`;
    }
    case "bullet":
      return spec.target != null
        ? `${spec.value} against a target of ${spec.target}`
        : String(spec.value);
    case "status-dot":
      return `status ${spec.status}`;
    case "mini-bar":
    case "segmented":
      return `${spec.title}: ${spec.items.map((it) => `${it.label} ${it.value}`).join(", ")}`;
  }
}

/** Flatten a finished live reply to one screen-reader sentence. */
export function speakLiveReply(text: string): string {
  const parts: string[] = [];
  for (const seg of parseLiveReply(text)) {
    if (seg.kind === "text" || seg.kind === "code") parts.push(seg.text);
    else if (seg.complete && seg.spec) parts.push(speakSpec(seg.spec));
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// The prompt. Kept beside the parser so a test can assert every chart in the
// few-shot examples round-trips through parseLiveReply with a valid spec —
// the model is never shown grammar we can't render.
// ---------------------------------------------------------------------------

export const LIVE_SYSTEM_PROMPT = `You are a sharp data analyst. Answer in 90–150 words of plain prose. No headings, no bullet lists, no bold.

There are TWO chart forms and they are never interchangeable.

FORM A — inline, inside a sentence. ONE line, single backticks, numbers only, NO title:
\`microchart sparkline 132 148 141 165 182\` — a trend, 4–16 numbers
\`microchart sparkbar 12 18 9 22 30\` — bars, 4–16 numbers
\`microchart rug-strip 3 5 5 6 8 8 9 11\` — where values cluster, 4–16 numbers
\`microchart delta +0.18\` — change, as a signed fraction
\`microchart trend-arrow -0.05\` — direction, as a signed fraction
\`microchart bullet value=72 target=80 bands=50,90\` — progress vs target
\`microchart status-dot ok\` — one of: ok, warn, error, off, busy

FORM B — standalone, on its own lines, TRIPLE backticks, title on the opening line, data underneath, closing \`\`\` on a line of its own:
\`\`\`microchart mini-bar Net-new by region ($k)
NA 48
EU 39
UK 27
\`\`\`
\`\`\`microchart segmented Sessions by source
Organic 46
Paid 24
Referral 16
\`\`\`
\`\`\`microchart histogram Response time (ms)
180 190 205 195 210 230 260 320
\`\`\`
\`\`\`microchart seismogram Errors per minute
2 1 3 2 18 24 9 4 2 1
\`\`\`

Hard rules, in order of how often they are broken:
1. mini-bar, segmented, histogram and seismogram exist ONLY in Form B. Putting one in single backticks prints raw text at the reader instead of a chart.
2. Never put a newline or a title inside single backticks. If it needs a title, it is Form B.
3. Close every Form B block with \`\`\` on its own line before you carry on writing.
4. Never emit a counting sequence (1 2 3 4 …) or repeat the same data line twice. Numbers must look measured: uneven, plausible for the unit, and consistent with what the sentence around them says.

Use 4–6 Form A charts and one or two Form B charts. Pair them so they build on each other: a trend with its delta, a spike with the status it caused, a total with its breakdown, a measure with the target it missed. Use a different chart type each time rather than repeating one. Invent plausible, internally consistent numbers. Never explain the syntax or mention charts.`;

export const LIVE_FEW_SHOTS: { role: "user" | "assistant"; content: string }[] = [
  { role: "user", content: "Recap Q3 revenue for the board" },
  {
    role: "assistant",
    content:
      "Q3 landed 12% ahead of plan. Revenue built week over week `microchart sparkline 132 148 141 165 159 182 176 203`, up `microchart delta +0.184` on Q2, and growth was broad, not one deal carrying it:\n```microchart mini-bar Net-new by region ($k)\nNA 48\nEU 39\nUK 27\nAPAC 22\nLATAM 18\n```\nPipeline sits `microchart bullet value=72 target=80 bands=50,90` to target, our sixth straight beat. A clean quarter, clear to raise for Q4.",
  },
  { role: "user", content: "Did last night's deploy hurt latency?" },
  {
    role: "assistant",
    content:
      "Briefly, yes. p95 held near 180 ms `microchart sparkline 178 181 176 183 179 240 212 184` until the 02:10 deploy pushed it up `microchart delta +0.31` for twenty minutes:\n```microchart seismogram Slow requests per minute\n2 1 2 3 19 26 14 6 3 2 1 2\n```\nRollback landed at 02:31 `microchart status-dot warn`, and by morning we were back inside budget `microchart bullet value=91 target=100 bands=80,110`. Adding a latency gate to the canary.",
  },
  { role: "user", content: "How did NVDA trade today?" },
  {
    role: "assistant",
    content:
      "NVDA closed +3.8% `microchart trend-arrow +0.038`, climbing steadily into the bell `microchart sparkline 100 101 102 104 103 105 107 109`. Volume skewed to the open and the close `microchart sparkbar 42 28 19 15 14 18 26 38`, and intraday returns stayed tight, no fat tails:\n```microchart histogram 1-min returns (bps)\n-2 -1 0 1 -1 2 1 0 3 1 -1 0 2 1 4 -2 1 0\n```\nThe desk sits `microchart delta +0.021` over benchmark weight going into tomorrow.",
  },
  // The long form. Two fenced charts, six inline marks, no chart type used
  // twice — the model copies the SHAPE of an example far more reliably than it
  // follows a word count, so one example has to actually be this size.
  { role: "user", content: "Break down our traffic mix this week" },
  {
    role: "assistant",
    content:
      "Sessions grew steadily `microchart sparkline 4200 4390 4310 4580 4720 4950 5210`, up `microchart delta +0.11` on last week, and the mix stayed healthy rather than paid-heavy:\n```microchart segmented Sessions by source\nOrganic 46\nPaid 24\nReferral 16\nEmail 9\nSocial 5\n```\nOrganic has led for nine straight weeks `microchart trend-arrow +0.04`, and conversion held `microchart status-dot ok` through the growth. Signups followed rather than lagged `microchart sparkbar 118 126 121 139 144 151 163`, so the extra traffic was the right traffic. Where it landed is the one thing worth watching:\n```microchart mini-bar Signups by first page\nPricing 61\nDocs 44\nBlog 29\nHome 22\n```\nPricing carrying the front door puts us `microchart bullet value=163 target=150 bands=120,180` past the weekly signup target, our third beat in a row.",
  },
];

/**
 * The chips under the composer.
 *
 * Deliberately NOT the four few-shot prompts — a chip that replays a memorised
 * example demos the few-shot, not the model — and deliberately not the five
 * scripted tabs' jobs (board recap, on-call, trading desk, personal wellness,
 * a training run). These are the questions the people reading this page
 * actually get asked: inference spend, activation, retention, clinical ops.
 * Each also lands on a different shape — a breakdown, a funnel, a cohort trend,
 * a distribution.
 */
export const LIVE_SAMPLES = [
  "Why did our LLM bill double last month?",
  "Which onboarding step is losing the most signups?",
  "Is the new pricing tier actually reducing churn?",
  "How long are patients waiting in triage?",
];
