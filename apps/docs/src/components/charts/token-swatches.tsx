"use client";
import { useState, type CSSProperties } from "react";
import { Check, Copy } from "lucide-react";
import { Sparkline } from "@microcharts/react/sparkline";
import { MiniBar } from "@microcharts/react/mini-bar";
import { cn } from "@/lib/cn";
import { SEMANTIC_TOKENS, CATEGORICAL_TOKENS, PRESETS, type ColorToken } from "@/lib/mc-tokens";
import { serializeTokens } from "@/lib/token-export";

/**
 * Visual reference for the library `--mc-*` colour tokens on the theming page.
 *
 * Each chip paints the LIBRARY value literally (not a live `getComputedStyle`
 * read) because this docs site re-tints the tokens for its own glass surface —
 * a live read would contradict the values documented in the same page. The
 * hexes come from `@/lib/mc-tokens`, kept honest by `mc-tokens.test.ts`.
 */

// A single copyable colour chip: the fill IS the value, hex sits alongside.
function Chip({ value, label, derived }: { value: string; label: string; derived?: boolean }) {
  const [copied, setCopied] = useState(false);
  // Near-white/near-black fills would vanish on the tile — draw a hairline ring.
  const ring = /#(e|f)|#[0-9a-f]{0,2}1[0-9a-f]|inherit/i.test(value);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      aria-label={`Copy ${label} ${value}`}
      className="group/chip flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-fd-border/70 p-1.5 text-left transition-colors hover:border-fd-primary/40"
    >
      <span
        className={cn(
          "relative grid size-7 shrink-0 place-items-center rounded-md",
          ring && "ring-1 ring-inset ring-fd-border",
        )}
        style={{ background: value }}
      >
        <Check
          className={cn(
            "size-3.5 text-white mix-blend-difference transition-opacity",
            copied ? "opacity-100" : "opacity-0",
          )}
        />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="mono-label block text-[0.56rem] uppercase opacity-60">{label}</span>
        <span className="block truncate font-mono text-[0.72rem] tabular-nums text-fd-muted-foreground">
          {copied ? "copied" : derived ? "derived" : value}
        </span>
      </span>
    </button>
  );
}

function TokenRow({ token }: { token: ColorToken }) {
  return (
    <div className="grid grid-cols-[9.5rem_1fr] items-center gap-3 py-1.5">
      <div className="min-w-0 leading-tight">
        <code className="block truncate text-[0.78rem] font-medium text-fd-foreground">
          {token.tone ?? token.cssVar}
        </code>
        <span className="block truncate text-[0.7rem] text-fd-muted-foreground">
          {token.tone ? token.cssVar : token.role}
        </span>
      </div>
      <div className="flex gap-2">
        <Chip value={token.light} label="Light" derived={token.derived} />
        <Chip value={token.dark} label="Dark" derived={token.derived} />
      </div>
    </div>
  );
}

function Group({ title, tokens }: { title: string; tokens: ColorToken[] }) {
  return (
    <div>
      <div className="mono-label mb-1 text-[0.6rem]">{title}</div>
      <div className="divide-y divide-fd-border/50">
        {tokens.map((t) => (
          <TokenRow key={t.cssVar} token={t} />
        ))}
      </div>
    </div>
  );
}

export function TokenSwatches() {
  return (
    <div className="not-prose my-6 grid gap-6 sm:grid-cols-2">
      <Group title="Semantic — meaning is fixed" tokens={SEMANTIC_TOKENS} />
      <Group title="Categorical — multi-series only" tokens={CATEGORICAL_TOKENS} />
    </div>
  );
}

// A truthful light-surface context: every preset (including mono/print/eink,
// whose inks run near-black) previews on "paper" regardless of the docs theme,
// exactly as it renders on a light page. Values come from the same mirror the
// swatches use, so the preview and the chips can never disagree.
const LIGHT_BASE = Object.fromEntries(
  [...SEMANTIC_TOKENS, ...CATEGORICAL_TOKENS].map((t) => [t.cssVar, t.light]),
) as CSSProperties;

// The preview exercises exactly the tokens presets retune: a line (stroke +
// stroke-width) with an accent endpoint, over signed bars whose valence colours
// (positive / negative) make mono's "all one ink" and vivid's punch obvious.
const PREVIEW_SERIES = [5, 8, 6, 11, 9, 13, 11, 16, 14, 19];
const PREVIEW_BARS = [
  { label: "a", value: 4 },
  { label: "b", value: -3 },
  { label: "c", value: 6 },
  { label: "d", value: -2 },
  { label: "e", value: 3 },
  { label: "f", value: 7 },
  { label: "g", value: -4 },
  { label: "h", value: 5 },
];

const isColor = (v: string) => /^(#|color-mix|var)/.test(v);
const shortVar = (cssVar: string) => cssVar.replace("--mc-", "");

// One retuned token: a colour gets a swatch, a stroke-width gets a line drawn at
// that exact weight — so the delta is legible at a glance, not just as a hex.
function DeltaChip({ cssVar, value }: { cssVar: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-fd-border/60 bg-fd-card/70 px-1.5 py-1">
      {isColor(value) ? (
        <span
          aria-hidden
          className="size-3.5 shrink-0 rounded-[3px] ring-1 ring-inset ring-black/15 dark:ring-white/15"
          style={{ background: value }}
        />
      ) : (
        <span aria-hidden className="flex size-3.5 shrink-0 items-center justify-center">
          <span className="w-full rounded-full bg-fd-foreground" style={{ height: `${value}px` }} />
        </span>
      )}
      <span className="mono-label text-[0.5rem] uppercase opacity-55">{shortVar(cssVar)}</span>
      <span className="font-mono text-[0.68rem] tabular-nums text-fd-muted-foreground">
        {value.startsWith("var(") ? "= ink" : value.startsWith("color-mix") ? "tint" : value}
      </span>
    </span>
  );
}

// Copy a preset's full token block (light + hand-tuned dark) as ready CSS —
// the quick path next to each card; the studio below is the full instrument.
function CopyPresetTokens({ preset }: { preset: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        const css = serializeTokens({
          preset,
          accent: null,
          mode: "both",
          include: "color",
          scope: ":root",
          format: "css",
          annotate: false,
        });
        void navigator.clipboard.writeText(css).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
      aria-label={`Copy ${preset} tokens for light and dark`}
      className="inline-flex items-center gap-1 rounded-md border border-fd-border/70 px-1.5 py-0.5 text-[0.62rem] font-medium text-fd-muted-foreground transition-colors hover:border-fd-primary/40 hover:text-fd-foreground"
    >
      {copied ? (
        <Check className="size-3 text-fd-primary" />
      ) : (
        <Copy className="size-3" />
      )}
      {copied ? "Copied" : "Copy tokens"}
    </button>
  );
}

/**
 * What each preset retunes — shown, not just told. Each card renders real charts
 * (a line + valence bars) under that preset's own tokens on a paper surface,
 * then lists the changed tokens as colour/weight swatches. Mirrors
 * `@/lib/mc-tokens`.
 */
export function PresetDeltas() {
  return (
    <div className="not-prose my-6 grid gap-3.5 sm:grid-cols-2">
      {PRESETS.map((p) => {
        const style = {
          ...LIGHT_BASE,
          ...Object.fromEntries(p.changes.map((c) => [c.cssVar, c.value])),
        } as CSSProperties;
        return (
          <div
            key={p.id}
            className="group/preset overflow-hidden rounded-xl border border-fd-border/70 bg-fd-card/40 transition-all duration-200 hover:-translate-y-0.5 hover:border-fd-primary/40 hover:shadow-sm"
          >
            {/* live preview — real charts rendered under this preset's tokens,
                on paper: a line (stroke + weight + accent dot) over signed bars
                (positive / negative valence) so every preset reads distinctly. */}
            <div
              className="preset-paper flex flex-col items-center justify-center gap-2 px-4 py-3.5"
              style={style}
            >
              <Sparkline
                data={PREVIEW_SERIES}
                width={200}
                height={30}
                curve="smooth"
                fill
                dots="minmax"
                summary={false}
              />
              <MiniBar data={PREVIEW_BARS} positive="up" width={200} height={18} summary={false} />
            </div>
            <div className="border-t border-fd-border/60 p-3.5">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-fd-foreground">{p.label}</span>
                {p.id === "modern" && (
                  <span className="mono-label text-[0.5rem] uppercase opacity-55">default</span>
                )}
                <span className="ml-auto opacity-70 transition-opacity group-hover/preset:opacity-100 focus-within:opacity-100">
                  <CopyPresetTokens preset={p.id} />
                </span>
              </div>
              <p className="text-[0.78rem] leading-snug text-fd-muted-foreground">{p.note}</p>
              {p.changes.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5" style={style}>
                  {p.changes.map((c) => (
                    <DeltaChip key={c.cssVar} cssVar={c.cssVar} value={c.value} />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
