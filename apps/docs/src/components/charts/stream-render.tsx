"use client";
// oxlint-disable react/no-array-index-key -- streamed text/chart nodes have
// stable POSITIONAL identity (order never changes; only the tail grows), so the
// index is the correct key. Content-derived keys would remount — and re-animate —
// already-rendered charts on every token tick.
/**
 * The chart-grammar renderer: partially-streamed Markdown → real components.
 * Shared by the scripted `StreamDemo` tabs and the on-device live tab, so both
 * paths produce byte-identical marks from the same text.
 */
import { memo, type ReactNode } from "react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { ActivityGrid } from "@microcharts/react/activity-grid";
import { Horizon } from "@microcharts/react/horizon";
import { Waveform } from "@microcharts/react/waveform";
import { Seismogram } from "@microcharts/react/seismogram";
import { HeatStrip } from "@microcharts/react/heat-strip";
import { RugStrip } from "@microcharts/react/rug-strip";
import { HistogramStrip } from "@microcharts/react/histogram-strip";
import { MiniBar } from "@microcharts/react/mini-bar";
import { Funnel } from "@microcharts/react/funnel";
import { Waterfall } from "@microcharts/react/waterfall";
import { TrendArrow } from "@microcharts/react/trend-arrow";
import { Progress } from "@microcharts/react/progress";
import { ProgressRing } from "@microcharts/react/progress-ring";
import { Thermometer } from "@microcharts/react/thermometer";
import { StatusDot } from "@microcharts/react/status-dot";
import { MicroBox } from "@microcharts/react/micro-box";
import { TallyMarks } from "@microcharts/react/tally-marks";
import { DotPlot } from "@microcharts/react/dot-plot";
import { SegmentedBar } from "@microcharts/react/segmented-bar";

export type Node =
  | { t: "text"; v: string }
  | { t: "code"; type: string; body: string; closed: boolean };

const FENCE_OPEN = "```microchart";

// Split partially-revealed markdown into text + fenced-chart nodes. Handles a
// fence still streaming (closed:false) so it can render raw first, then morph.
export function parse(src: string): Node[] {
  const nodes: Node[] = [];
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf(FENCE_OPEN, i);
    if (open === -1) {
      nodes.push({ t: "text", v: src.slice(i) });
      break;
    }
    if (open > i) nodes.push({ t: "text", v: src.slice(i, open) });
    const headerEnd = src.indexOf("\n", open);
    if (headerEnd === -1) {
      nodes.push({
        t: "code",
        type: src.slice(open + FENCE_OPEN.length).trim(),
        body: "",
        closed: false,
      });
      break;
    }
    const type = src.slice(open + FENCE_OPEN.length, headerEnd).trim();
    const close = src.indexOf("```", headerEnd + 1);
    if (close === -1) {
      nodes.push({ t: "code", type, body: src.slice(headerEnd + 1), closed: false });
      break;
    }
    nodes.push({ t: "code", type, body: src.slice(headerEnd + 1, close).trim(), closed: true });
    i = close + 3;
    if (src[i] === "\n") i += 1;
  }
  return nodes;
}

function nums(body: string): number[] {
  return body
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

function kv(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const tok of body.split(/\s+/)) {
    const eq = tok.indexOf("=");
    if (eq > 0) out[tok.slice(0, eq)] = tok.slice(eq + 1);
  }
  return out;
}

/** Block info string is `<type> [title…]`; split them, with a sensible default. */
const DEFAULT_TITLE: Record<string, string> = {
  sparkline: "Series",
  sparkbar: "Values",
  bullet: "Target",
  delta: "Change",
  activity: "Activity",
};
function splitInfo(info: string): { type: string; title: string } {
  const sp = info.indexOf(" ");
  const type = sp === -1 ? info : info.slice(0, sp);
  const title = sp === -1 ? (DEFAULT_TITLE[type] ?? "Chart") : info.slice(sp + 1).trim();
  return { type, title };
}

const CHART_W = 240;
const labeled = (b: string, prefix: string) =>
  nums(b).map((v, i) => ({ label: `${prefix}${i + 1}`, value: v }));

/** Categorical bodies are one `LABEL VALUE` per line. A body that is just
 *  numbers (the scripted scenarios) falls back to positional labels. */
function pairs(body: string, prefix: string): { label: string; value: number }[] {
  const out: { label: string; value: number }[] = [];
  for (const line of body.split("\n")) {
    const toks = line
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean);
    if (toks.length === 0) continue;
    const value = Number(toks[toks.length - 1]);
    // A line that opens with a number is a positional series, not a pair.
    if (toks.length < 2 || !Number.isFinite(value) || Number.isFinite(Number(toks[0])))
      return labeled(body, prefix);
    out.push({ label: toks.slice(0, -1).join(" "), value });
  }
  return out.length > 0 ? out : labeled(body, prefix);
}

// One renderer for every supported grammar type — the demo reaches across the
// catalog, not the same five charts everywhere. Charts are decorative
// (summary={false}); block charts get a visible mono caption (from the info
// string), inline ones are described by the surrounding sentence.
// Accent-tint neutral charts; keep semantic colour on delta/trend/status/bullet/etc.
const TINTED = new Set([
  "sparkline",
  "sparkbar",
  "horizon",
  "waveform",
  "seismogram",
  "rug-strip",
  "histogram",
  "mini-bar",
  "micro-box",
  "dot-plot",
  "funnel",
  "waterfall",
]);
export function renderStream(type: string, body: string, block: boolean): ReactNode {
  const acc = TINTED.has(type)
    ? { summary: false as const, color: "var(--mc-accent)" }
    : { summary: false as const };
  switch (type) {
    case "sparkline":
      return (
        <Sparkline
          data={nums(body)}
          width={block ? CHART_W : 54}
          height={block ? 44 : 15}
          curve="smooth"
          dots={block ? "minmax" : undefined}
          label={block ? "last" : undefined}
          {...acc}
        />
      );
    case "sparkbar":
      return (
        <SparkBar
          data={nums(body)}
          width={block ? CHART_W : 46}
          height={block ? 44 : 15}
          {...acc}
        />
      );
    case "horizon":
      return (
        <Horizon data={nums(body)} width={block ? CHART_W : 56} height={block ? 34 : 14} {...acc} />
      );
    case "waveform":
      return (
        <Waveform
          data={nums(body)}
          width={block ? CHART_W : 54}
          height={block ? 40 : 15}
          {...acc}
        />
      );
    case "seismogram":
      return (
        <Seismogram
          data={nums(body)}
          width={block ? CHART_W : 56}
          height={block ? 40 : 16}
          {...acc}
        />
      );
    case "heat-strip":
      return (
        <HeatStrip
          data={nums(body)}
          width={block ? CHART_W : 56}
          height={block ? 22 : 12}
          {...acc}
        />
      );
    case "rug-strip":
      return (
        <RugStrip
          data={nums(body)}
          width={block ? CHART_W : 56}
          height={block ? 20 : 12}
          {...acc}
        />
      );
    case "histogram":
      return (
        <HistogramStrip
          data={nums(body)}
          width={block ? CHART_W : 60}
          height={block ? 40 : 16}
          {...acc}
        />
      );
    case "activity":
      return <ActivityGrid data={nums(body)} layout="strip" cell={block ? 10 : 6} {...acc} />;
    case "mini-bar":
      return (
        <MiniBar
          data={pairs(body, "c")}
          width={block ? CHART_W : 56}
          height={block ? 40 : 16}
          {...acc}
        />
      );
    case "segmented":
      return (
        <SegmentedBar
          data={pairs(body, "s")}
          width={block ? CHART_W : 56}
          height={block ? 16 : 12}
          summary={false}
        />
      );
    case "funnel":
      return (
        <Funnel
          data={labeled(body, "s")}
          width={block ? CHART_W : 60}
          height={block ? 44 : 18}
          {...acc}
        />
      );
    case "waterfall":
      return (
        <Waterfall
          data={labeled(body, "S")}
          width={block ? CHART_W : 64}
          height={block ? 44 : 18}
          {...acc}
        />
      );
    case "bullet": {
      const p = kv(body);
      return (
        <Bullet
          value={Number(p.value)}
          target={p.target ? Number(p.target) : undefined}
          bands={p.bands ? p.bands.split(",").map(Number) : undefined}
          width={block ? CHART_W : 58}
          height={block ? 26 : 11}
          {...acc}
        />
      );
    }
    case "progress": {
      const p = kv(body);
      const v = p.value !== undefined ? Number(p.value) : Number(body.trim());
      return <Progress value={v} width={block ? CHART_W : 56} height={block ? 12 : 10} {...acc} />;
    }
    case "thermometer": {
      const p = kv(body);
      return (
        <Thermometer
          value={Number(p.value)}
          target={p.target ? Number(p.target) : undefined}
          height={block ? 48 : 22}
          {...acc}
        />
      );
    }
    case "delta":
      return <Delta value={Number(body.trim())} {...acc} />;
    case "trend-arrow":
      return <TrendArrow value={Number(body.trim())} {...acc} />;
    case "status-dot":
      return (
        <StatusDot
          status={body.trim()}
          style={{ width: block ? 12 : 10, height: block ? 12 : 10 }}
          {...acc}
        />
      );
    case "micro-box":
      return (
        <MicroBox
          data={nums(body)}
          width={block ? CHART_W : 64}
          height={block ? 36 : 16}
          {...acc}
        />
      );
    case "progress-ring": {
      const p = kv(body);
      const v = p.value !== undefined ? Number(p.value) : Number(body.trim());
      const d = block ? 30 : 15;
      // label="none" drops the centred percent so the ring fills its box and
      // sits centred on the text line instead of high (label reserves space).
      return <ProgressRing value={v} label="none" style={{ width: d, height: d }} {...acc} />;
    }
    case "tally-marks": {
      const p = kv(body);
      const v = p.value !== undefined ? Number(p.value) : Number(body.trim());
      return <TallyMarks value={v} height={block ? 24 : 15} {...acc} />;
    }
    case "dot-plot":
      return (
        <DotPlot
          data={labeled(body, "d")}
          width={block ? CHART_W : 60}
          height={block ? 30 : 22}
          {...acc}
        />
      );
    default:
      return null;
  }
}

// Text metrics (Delta) keep their own baseline so the number sits on the
// sentence line. Every other inline SVG mark gets `.mc-inline`, which seats
// the mark on the text baseline (font-independent — see styles.css).
const TEXT_GLYPH = new Set(["delta"]);

const RAW_CODE = "font-mono text-[0.8rem] text-fd-muted-foreground";

// Standalone block chart (fenced form). Info string is `<type> [title…]`. Memoized:
// once a fence closes its (info, body) are final, so it skips later token re-renders.
const BlockChart = memo(function BlockChart({ info, body }: { info: string; body: string }) {
  const { type, title } = splitInfo(info);
  const node = renderStream(type, body, true);
  // An unknown type stays legible as the text the model actually emitted,
  // rather than vanishing — the live tab renders whatever Nano writes.
  if (!node) return <code className={`${RAW_CODE} block whitespace-pre`}>{body}</code>;
  if (type === "delta" || type === "status-dot") return <span className="text-xl">{node}</span>;
  return (
    <figure className="not-prose flex flex-col gap-1.5">
      <figcaption className="mono-label opacity-55">{title}</figcaption>
      {node}
    </figure>
  );
});

// Inline chart inside a sentence.
const InlineChart = memo(function InlineChart({ spec }: { spec: string }) {
  const sp = spec.indexOf(" ");
  const type = sp === -1 ? spec : spec.slice(0, sp);
  const data = sp === -1 ? "" : spec.slice(sp + 1);
  const node = renderStream(type, data, false);
  if (!node) return <code className={RAW_CODE}>{`microchart ${spec}`}</code>;
  if (TEXT_GLYPH.has(type)) return <span className="mx-1">{node}</span>;
  return <span className="mc-inline mc-morph">{node}</span>;
});

// Inline markdown — **bold**, an inline `microchart …` span, or plain `code`.
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <>
      {parts.map((part) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return (
            <strong key={`b:${part}`} className="font-medium text-fd-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        if (part.startsWith("`") && part.endsWith("`")) {
          const inner = part.slice(1, -1);
          if (inner.startsWith("microchart "))
            return <InlineChart key={`mc:${inner}`} spec={inner.slice(11)} />;
          return (
            <code key={`code:${inner}`} className="font-mono text-[0.9em] text-fd-primary">
              {inner}
            </code>
          );
        }
        return <span key={`t:${part}`}>{part}</span>;
      })}
    </>
  );
}

// Split a text run into the settled head and the word that just landed.
function splitTail(v: string): [head: string, tail: string] {
  const end = /\s$/.test(v) ? v.length - 1 : v.length;
  const cut = v.lastIndexOf(" ", end - 1);
  return cut === -1 ? ["", v] : [v.slice(0, cut + 1), v.slice(cut + 1)];
}

// One rendered message body. `animate` adds the settle on block charts; the ghost
// copy passes false. While `streaming`, the final text node's last word is split
// out and faded in — that replaced the blinking block caret, which snapped on and
// off twice a second at the tail and read as flicker.
//
// Nodes are keyed by POSITION (index), never by content. parse() only ever
// extends the last node or appends a new one as the stream grows, so index i
// keeps the same semantic node throughout — React updates its text in place
// instead of remounting the span. Content-derived keys grew every token, which
// remounted each text span AND re-mounted the inline charts inside it, replaying
// their entrance animation on every tick (the visible flicker). A fenced block
// flipping open→closed does change the element type at its index, so THAT node
// remounts once and morphs in — which is exactly what we want.
export function Message({
  nodes,
  animate,
  streaming = false,
  tick = 0,
}: {
  nodes: Node[];
  animate: boolean;
  streaming?: boolean;
  /** WORD counter (not token) — keys the fading tail so it replays exactly once
   *  per word. Pass the raw token count and every word fades twice, because the
   *  trailing-whitespace token bumps the key while the tail is still that same
   *  word. Keying on the tail's text instead would skip the fade whenever a
   *  word repeats. */
  tick?: number;
}) {
  const lastText = streaming && nodes.length > 0 && nodes[nodes.length - 1]?.t === "text";
  return (
    <div className="max-w-xl text-[0.98rem] leading-relaxed text-fd-foreground/85">
      {nodes.map((n, i) =>
        n.t === "text" ? (
          <span key={i} className="whitespace-pre-wrap">
            {lastText && i === nodes.length - 1 ? (
              // Splitting here also SHRINKS the work per token: the head stops
              // growing, so Inline's content-derived keys stop churning and
              // only the one-word tail remounts.
              (() => {
                const [head, tail] = splitTail(n.v);
                return (
                  <>
                    <Inline text={head} />
                    <span key={tick} className="mc-tok">
                      {tail}
                    </span>
                  </>
                );
              })()
            ) : (
              <Inline text={n.v} />
            )}
          </span>
        ) : n.closed ? (
          <span key={i} className={`my-2 flex justify-start${animate ? " mc-stream-chart" : ""}`}>
            <BlockChart info={n.type} body={n.body} />
          </span>
        ) : (
          // Bare, like the hero's raw fence — no `.code-inset`. That class
          // fills with `--glass-surface-strong`, which on light is a near-white
          // frost, so a slab appeared behind the grammar and then vanished when
          // the chart replaced it. A model emitting a fence is mid-sentence, not
          // presenting a code sample; it should read as text until it becomes a
          // chart. Padding goes with it, or the block would still shift as the
          // panel dissolved.
          <code key={i} className={`my-3 block whitespace-pre ${RAW_CODE}`}>
            {"```microchart " + n.type + "\n" + n.body}
          </code>
        ),
      )}
    </div>
  );
}
