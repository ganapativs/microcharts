import {
  Children,
  cloneElement,
  createElement,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { getModule } from "@/lib/charts/registry";
import { OG } from "@/lib/og-theme";

function inkStyle(ink: string, tag: string): CSSProperties | undefined {
  const stroked = tag === "path" || tag === "line" || tag === "polyline";
  switch (ink) {
    case "data":
      return {
        fill: "none",
        stroke: OG.ink,
        strokeWidth: 2,
        strokeLinejoin: "round",
        strokeLinecap: "round",
      };
    case "accent":
      return stroked
        ? { fill: "none", stroke: OG.accent, strokeWidth: 1.5 }
        : { fill: OG.accent, stroke: "none" };
    case "point":
    case "bar":
    case "cell":
      return { fill: OG.accent, stroke: "none" };
    case "positive":
      return stroked
        ? { fill: "none", stroke: "#0e7a5f", strokeWidth: 1.5 }
        : { fill: "#0e7a5f", stroke: "none" };
    case "negative":
      return stroked
        ? { fill: "none", stroke: "#bd4b2d", strokeWidth: 1.5 }
        : { fill: "#bd4b2d", stroke: "none" };
    case "fill":
      return { fill: OG.accent, opacity: 0.14, stroke: "none" };
    case "band":
    case "unit-off":
    case "gap":
      return { fill: OG.rule, stroke: "none" };
    case "muted":
      return { fill: "none", stroke: OG.muted, strokeWidth: 1 };
    case "neutral":
    case "ghost":
      return { fill: OG.muted, opacity: ink === "ghost" ? 0.3 : 1, stroke: "none" };
    case "region":
      return { fill: OG.accent, opacity: 0.12, stroke: "none" };
    case "label":
      return { fill: OG.ink };
    default:
      return undefined;
  }
}

const CAT = ["#c2410c", "#0e7a5f", "#2f52d4", "#b45309", "#7c3aed", "#0f766e"] as const;

const MC_VARS: Record<string, string> = {
  "--mc-stroke": OG.ink,
  "--mc-accent": OG.accent,
  "--mc-muted": OG.muted,
  "--mc-neutral": OG.muted,
  "--mc-positive": "#0e7a5f",
  "--mc-negative": "#bd4b2d",
  "--mc-cat-1": CAT[0],
  "--mc-cat-2": CAT[1],
  "--mc-cat-3": CAT[2],
  "--mc-cat-4": CAT[3],
  "--mc-cat-5": CAT[4],
  "--mc-cat-6": CAT[5],
  "--mc-sw": "1.5",
};

/** Known chart / utility classes → inline styles (Satori has no styles.css). */
function classStyles(className: string | undefined): CSSProperties | undefined {
  if (!className) return undefined;
  const s: CSSProperties = {};
  const has = (c: string) => className.includes(c);

  if (has("inline-flex") || has("mc-token-confidence") || has("mc-delta")) {
    s.display = "flex";
  }
  if (has("flex-col")) s.flexDirection = "column";
  if (has("items-center")) s.alignItems = "center";
  if (has("items-end")) s.alignItems = "flex-end";
  if (has("items-start")) s.alignItems = "flex-start";
  if (has("justify-center")) s.justifyContent = "center";
  if (has("gap-0.5")) s.gap = 2;
  else if (has("gap-1")) s.gap = 4;
  else if (has("gap-2")) s.gap = 8;
  else if (has("gap-3")) s.gap = 12;
  else if (has("gap-4")) s.gap = 16;
  if (has("tabular-nums")) s.fontVariantNumeric = "tabular-nums";

  if (has("mc-token-confidence")) {
    Object.assign(s, {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "baseline",
      maxWidth: 440,
      fontSize: 26,
      lineHeight: 1.55,
      color: OG.ink,
      fontFamily: "system-ui, sans-serif",
    });
  }
  if (has("mc-tc-unsure")) {
    Object.assign(s, {
      textDecorationLine: "underline",
      textDecorationStyle: "solid",
      textDecorationColor: CAT[0],
      textDecorationThickness: 3,
    });
  }
  if (has("mc-tc-guessing")) {
    Object.assign(s, {
      textDecorationLine: "underline",
      textDecorationStyle: "solid",
      textDecorationColor: "#bd4b2d",
      textDecorationThickness: 4,
    });
  }
  if (has("mc-tc-seen")) {
    Object.assign(s, {
      textDecorationLine: "underline",
      textDecorationStyle: "solid",
      textDecorationColor: OG.muted,
      textDecorationThickness: 1,
      opacity: 0.55,
    });
  }
  if (has("mc-tc-legend")) {
    Object.assign(s, { color: OG.muted, fontSize: "0.85em", whiteSpace: "nowrap" });
  }
  if (has("mc-delta")) {
    Object.assign(s, {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: 42,
      fontWeight: 600,
      fontVariantNumeric: "tabular-nums",
      color: OG.ink,
    });
  }
  if (has("mc-fat")) {
    Object.assign(s, {
      fontFamily: "system-ui, sans-serif",
      fontVariantNumeric: "tabular-nums",
      color: OG.ink,
    });
  }

  return Object.keys(s).length ? s : undefined;
}

function resolveCssColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const m = value.match(/^var\((--[\w-]+)(?:,\s*(.+))?\)$/);
  if (!m) return value;
  return MC_VARS[m[1] ?? ""] ?? m[2]?.trim() ?? OG.ink;
}

function resolveStyleColors(style: CSSProperties | undefined): CSSProperties | undefined {
  if (!style) return style;
  const stroke = resolveCssColor(style.stroke);
  const fill = resolveCssColor(style.fill);
  if (stroke === style.stroke && fill === style.fill) return style;
  return { ...style, ...(stroke ? { stroke } : null), ...(fill ? { fill } : null) };
}

/** Satori crashes on `style` keys whose value is undefined (calls .trim()). */
function cleanStyle(style: CSSProperties | undefined): CSSProperties | undefined {
  if (!style) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(style)) {
    if (v == null || v === false) continue;
    // Drop CSS vars — colors are already baked; Satori has no var().
    if (k.startsWith("--")) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? (out as CSSProperties) : undefined;
}

type AnyProps = {
  style?: CSSProperties;
  children?: ReactNode;
  className?: string;
  width?: number | string;
  height?: number | string;
  viewBox?: string;
  fill?: string;
  stroke?: string;
  fontSize?: number | string;
  fontWeight?: number | string;
  "data-mc-ink"?: string;
  "data-mc-cat"?: string | number;
  "data-mc-valence"?: string;
};

type Ctx = {
  valence?: string;
  /** Cap SVG side length when Preview lays out many glyphs in a row. */
  maxSide?: number;
};

function valenceFill(v: string | undefined): string {
  if (v === "neg") return "#bd4b2d";
  if (v === "flat") return OG.muted;
  return "#0e7a5f";
}

function px(n: number | string | undefined, fallback: number): number {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  if (typeof n === "string") {
    if (n.endsWith("em")) return Number.parseFloat(n) * 16;
    const v = Number.parseFloat(n);
    if (Number.isFinite(v)) return v;
  }
  return fallback;
}

/** Expand function components, then bake ink roles into host-element styles. */
function materialize(node: ReactNode, ctx: Ctx = {}): ReactNode {
  if (node == null || typeof node === "boolean") return null;
  if (Array.isArray(node)) return node.map((n) => materialize(n, ctx));
  if (typeof node === "string" || typeof node === "number") return node;
  if (!isValidElement(node)) return null;

  let el: ReactElement = node;

  for (let i = 0; i < 12; i++) {
    const t = el.type;
    if (typeof t === "symbol") {
      return Children.map((el.props as AnyProps).children, (n) => materialize(n, ctx));
    }
    if (typeof t !== "function") break;
    const out = (t as (p: object) => ReactNode)(el.props as object);
    if (Array.isArray(out)) return out.map((n) => materialize(n, ctx));
    if (!isValidElement(out)) return materialize(out, ctx);
    el = out;
  }

  if (typeof el.type === "symbol") {
    return Children.map((el.props as AnyProps).children, (n) => materialize(n, ctx));
  }
  if (typeof el.type !== "string") {
    return Children.map((el.props as AnyProps).children, (n) => materialize(n, ctx));
  }

  // Share cards: drop SVG labels — they collide at this scale and add no signal.
  // Text-as-chart types (FatDigits / FillWord / TokenConfidence) use OG_HAND.
  if (el.type === "text" || el.type === "tspan" || el.type === "title" || el.type === "desc") {
    return null;
  }

  const props = el.props as AnyProps;
  const nextCtx: Ctx = props["data-mc-valence"] ? { valence: props["data-mc-valence"] } : ctx;
  const ink = props["data-mc-ink"];
  const cat = props["data-mc-cat"];
  let painted =
    (ink ? inkStyle(ink, el.type) : undefined) ??
    (cat !== undefined ? { fill: CAT[Number(cat) % CAT.length] } : undefined);

  if (!painted && el.type === "path" && !props.fill && !props.style?.fill) {
    painted = { fill: valenceFill(nextCtx.valence) };
  }

  const fromClass = classStyles(props.className);
  const baseStyle = resolveStyleColors(props.style);

  // Multi-glyph Previews (status-dot, moon-phase, …) — share the rail width.
  let childCtx = nextCtx;
  if (
    (el.type === "span" || el.type === "div") &&
    fromClass?.display === "flex" &&
    fromClass.flexDirection !== "column"
  ) {
    const n = Children.count(props.children);
    if (n > 1) {
      childCtx = { ...nextCtx, maxSide: Math.min(ctx.maxSide ?? 160, Math.floor(420 / n)) };
    }
  }

  const kids = Children.map(props.children, (n) => materialize(n, childCtx));
  const next: AnyProps = {
    ...props,
    className: undefined,
    style: cleanStyle({ ...fromClass, ...baseStyle, ...painted }),
    children: kids,
  };

  if (el.type === "svg") {
    const vb =
      typeof props.viewBox === "string" ? props.viewBox.match(/0 0 ([\d.]+) ([\d.]+)/) : null;
    const vw = vb ? Number(vb[1]) : px(props.width, 180);
    const vh = vb ? Number(vb[2]) : px(props.height, 48);
    const styleW = px(baseStyle?.width as number | string | undefined, 0);
    const styleH = px(baseStyle?.height as number | string | undefined, 0);
    const curW = Math.max(px(props.width, vw), styleW);
    const curH = Math.max(px(props.height, vh), styleH);
    const square = vw <= vh * 1.25 && vh <= vw * 1.25;
    const strip = vw >= vh * 1.6;
    const cap = ctx.maxSide ?? 200;
    let tw: number;
    let th: number;
    if (square || (curW <= 96 && curH <= 96)) {
      tw = Math.min(cap, 200);
      th = Math.max(56, Math.round((tw * vh) / Math.max(vw, 1)));
    } else if (curW < 320) {
      // Fill the rail width; keep aspect so strokes don't distort or spill the card.
      tw = Math.min(strip ? 440 : 280, ctx.maxSide ? ctx.maxSide * 2 : 440);
      th = Math.max(72, Math.round((tw * vh) / Math.max(vw, 1)));
    } else {
      tw = curW;
      th = curH || Math.round((tw * vh) / Math.max(vw, 1));
    }
    next.width = tw;
    next.height = th;
    next.style = cleanStyle({
      ...next.style,
      width: tw,
      height: th,
    });
  }

  // Bare text inside flex hosts needs a span so Satori doesn't collapse runs.
  if ((el.type === "span" || el.type === "div") && fromClass?.display === "flex") {
    const list = Children.toArray(kids);
    next.children = list.map((k, i) => {
      if (typeof k === "string" || typeof k === "number") {
        return (
          <span key={i} style={{ display: "flex" }}>
            {k}
          </span>
        );
      }
      return k;
    });
  }

  return cloneElement(el, next as never);
}

/** Right-rail mark for chart OG cards — live Preview, ink-painted for Satori. */
export function OgChartMark({ slug }: { slug: string }): ReactNode {
  const hand = OG_HAND[slug];
  const Preview = hand ? undefined : getModule(slug)?.Preview;
  if (!hand && !Preview) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: 480,
        minHeight: 300,
        padding: "36px 32px",
        background: OG.card,
        border: `1px solid ${OG.rule}`,
        borderRadius: 20,
        marginLeft: "auto",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        {hand ?? (Preview ? materialize(createElement(Preview)) : null)}
      </div>
    </div>
  );
}

/** Charts whose Preview is HTML/SVG-text — hand-drawn for Satori (no clipPath / weight axes). */
const OG_HAND: Record<string, ReactNode> = {
  "token-confidence": (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        maxWidth: 440,
        fontSize: 28,
        lineHeight: 1.55,
        color: OG.ink,
        fontFamily: "sans-serif",
      }}
    >
      {(
        [
          ["The", null],
          ["Treaty", null],
          ["of", null],
          ["Westphalia", "unsure"],
          ["was", null],
          ["signed", null],
          ["in", null],
          ["1648", "guess"],
          [",", null],
          ["ending", null],
          ["the", null],
          ["Thirty", "unsure"],
          ["Years", null],
          ["'", null],
          ["War", null],
          ["over", "guess"],
          ["a", null],
          ["decade", "guess"],
          [".", null],
        ] as const
      ).map(([t, tier], i) => {
        const mark =
          tier === "unsure"
            ? {
                textDecorationLine: "underline" as const,
                textDecorationColor: CAT[0],
                textDecorationThickness: 3,
              }
            : tier === "guess"
              ? {
                  textDecorationLine: "underline" as const,
                  textDecorationColor: "#bd4b2d",
                  textDecorationThickness: 4,
                }
              : null;
        const glue = t === "," || t === "'" || t === ".";
        return (
          <span
            key={`${i}-${t}`}
            style={{
              ...(i > 0 && !glue ? { paddingLeft: 8 } : null),
              ...mark,
            }}
          >
            {t}
          </span>
        );
      })}
    </div>
  ),
  "fat-digits": (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 6,
        fontFamily: "sans-serif",
        fontVariantNumeric: "tabular-nums",
        color: OG.ink,
      }}
    >
      {(
        [
          [1204, 42, 700],
          [318, 30, 400],
          [76, 26, 400],
          [942, 36, 700],
          [2100, 48, 700],
          [55, 24, 400],
        ] as const
      ).map(([v, size, weight]) => (
        <span key={v} style={{ fontSize: size, fontWeight: weight, lineHeight: 1 }}>
          {v.toLocaleString("en-US")}
        </span>
      ))}
    </div>
  ),
  "fill-word": (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, fontFamily: "sans-serif" }}>
      {(
        [
          ["uploading", 0.62],
          ["expiring", 0.3],
        ] as const
      ).map(([word, frac]) => (
        <div
          key={word}
          style={{ display: "flex", position: "relative", fontSize: 44, lineHeight: 1 }}
        >
          <span style={{ color: OG.muted, opacity: 0.4 }}>{word}</span>
          <div
            style={{
              display: "flex",
              position: "absolute",
              left: 0,
              top: 0,
              width: `${Math.round(frac * 100)}%`,
              overflow: "hidden",
            }}
          >
            <span style={{ color: OG.accent, whiteSpace: "nowrap", flexShrink: 0 }}>{word}</span>
          </div>
        </div>
      ))}
    </div>
  ),
};
