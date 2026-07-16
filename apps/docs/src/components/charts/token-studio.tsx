"use client";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Sparkline } from "@microcharts/react/sparkline";
import { MiniBar } from "@microcharts/react/mini-bar";
import { SegmentedBar } from "@microcharts/react/segmented-bar";
import { cn } from "@/lib/cn";
import { PRESETS } from "@/lib/mc-tokens";
import {
  ACCENTS,
  INK_PRESET_CATS,
  resolveTokens,
  serializeTokens,
  type Mode,
  type Format,
} from "@/lib/token-export";

/**
 * "Copy the tokens" studio for the theming page. Configure a look — a preset
 * style, an optional brand accent, a mode, a scope — see it on real charts in
 * BOTH light and dark, and copy the exact `--mc-*` block the library ships.
 *
 * The serialized output comes from the pure `serializeTokens` (kept honest by
 * `token-export.test.ts`), so what you copy is always the real contract.
 */

const PREVIEW_SERIES = [5, 8, 6, 11, 9, 13, 11, 16, 14, 19];
const PREVIEW_BARS = [
  { label: "a", value: 4 },
  { label: "b", value: -3 },
  { label: "c", value: 6 },
  { label: "d", value: -2 },
  { label: "e", value: 3 },
  { label: "f", value: 7 },
  { label: "g", value: -4 },
];
// Multi-series mix — the one preview mark that reads the categorical palette, so
// a brand accent's DERIVED categories (not just the emphasis ink) are visible.
const PREVIEW_MIX = [
  { label: "Chrome", value: 62 },
  { label: "Safari", value: 24 },
  { label: "Firefox", value: 9 },
  { label: "Edge", value: 5 },
];

// A compact segmented control — the studio's workhorse toggle.
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mono-label mb-1.5 text-[0.56rem]">{label}</div>
      <div
        role="radiogroup"
        aria-label={label}
        className="inline-flex rounded-lg border border-fd-border/70 bg-fd-card/40 p-0.5"
      >
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.id)}
              className={cn(
                "rounded-[0.4rem] px-2.5 py-1 text-[0.72rem] font-medium transition-colors",
                active
                  ? "bg-fd-primary/12 text-fd-foreground shadow-[inset_0_0_0_1px] shadow-fd-primary/30"
                  : "text-fd-muted-foreground hover:text-fd-foreground",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// The roles the preview names, painted from the resolved tokens so each swatch
// tracks the current style + accent live. Keyed to the marks above them.
const LEGEND = [
  { name: "Ink", token: "--mc-stroke" },
  { name: "Accent", token: "--mc-accent" },
  { name: "Up", token: "--mc-positive" },
  { name: "Down", token: "--mc-negative" },
] as const;

// One theme preview pane — real charts painted under a resolved token map, on a
// fixed light or ink "page" so the mode reads truthfully whatever the reader's.
// The sparkline shows ink + band + accent endpoint; the bars show valence with a
// single accent-highlighted peak, so a brand-accent choice is unmistakable.
function PreviewPane({
  tone,
  style,
  label,
}: {
  tone: "light" | "dark";
  style: CSSProperties;
  label: string;
}) {
  const dim = tone === "light" ? "text-black/55" : "text-white/60";
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-2 overflow-hidden rounded-lg px-4 pb-3 pt-6",
        // Fluid charts: the viewBox sets the aspect, CSS scales the SVG to the
        // pane so a fixed width can never spill past the rounded edge.
        "[&_svg]:!h-auto [&_svg]:!w-full",
        tone === "light" ? "preset-paper" : "preset-ink",
      )}
      style={style}
    >
      <span className={cn("mono-label absolute left-2.5 top-2 text-[0.5rem] !text-current", dim)}>
        {label}
      </span>
      {/* hv-theme-stage eases fill/stroke between palettes, so a swatch change
          reads as an intentional re-theme, not a hard flip (shared with the
          home widget). Three marks: accent line, derived categories, valence. */}
      <div className="hv-theme-stage flex w-full flex-1 flex-col justify-center gap-2">
        <Sparkline
          data={PREVIEW_SERIES}
          width={200}
          height={28}
          curve="smooth"
          fill
          dots="minmax"
          summary={false}
        />
        <SegmentedBar data={PREVIEW_MIX} width={200} height={14} summary={false} />
        <MiniBar
          data={PREVIEW_BARS}
          positive="up"
          highlight="f"
          width={200}
          height={16}
          summary={false}
        />
      </div>
      {/* role legend — tiny swatches that repaint with the tokens, so "Accent"
          visibly changes the moment a brand accent is picked. */}
      <div className={cn("mt-1 grid w-full max-w-[9rem] grid-cols-2 gap-x-3 gap-y-1", dim)}>
        {LEGEND.map((r) => (
          <span key={r.token} className="inline-flex items-center gap-1 text-[0.56rem]">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-[2px] ring-1 ring-inset ring-black/10 dark:ring-white/10"
              style={{ background: `var(${r.token})` }}
            />
            {r.name}
          </span>
        ))}
      </div>
    </div>
  );
}

const styleFrom = (entries: { cssVar: string; value: string }[]) =>
  Object.fromEntries(entries.map((e) => [e.cssVar, e.value])) as CSSProperties;

const PRESET_OPTS = PRESETS.map((p) => ({ id: p.id, label: p.label }));

export function TokenStudio() {
  const [preset, setPreset] = useState("modern");
  // Ember is the default, mirroring the site + appearance menu.
  const [accentChoice, setAccent] = useState<string | null>("ember");
  const [mode, setMode] = useState<Mode>("both");
  const [include, setInclude] = useState<"color" | "all">("color");
  const [format, setFormat] = useState<Format>("css");
  const [scope, setScope] = useState(":root");
  const [annotate, setAnnotate] = useState(false);

  // mono/print/eink own their entire ink set including the categorical ramp, so
  // a brand accent has nothing to attach to — mirror the home widget and ignore
  // the accent while one is active (the swatch stays remembered for when you
  // switch back). Everything below reads `accent` so preview = copy.
  const inkPreset = preset in INK_PRESET_CATS;
  const accent = inkPreset ? null : accentChoice;

  const code = useMemo(
    () =>
      serializeTokens({
        preset,
        accent,
        mode,
        include,
        scope: scope || ":root",
        format,
        annotate,
      }),
    [preset, accent, mode, include, scope, format, annotate],
  );

  // Preview always uses the full resolved set (geometry included) so weight
  // changes (editorial hairline, vivid bold) show — independent of the include
  // toggle, which only governs the copied output.
  const previewTokens = useMemo(
    () => resolveTokens({ preset, accent, include: "all" }),
    [preset, accent],
  );
  const lightStyle = styleFrom(previewTokens.light);
  const darkStyle = styleFrom(previewTokens.dark);

  const fileName = format === "js" ? "theme.ts" : mode === "dark" ? "theme.dark.css" : "theme.css";

  return (
    <div className="not-prose my-6 overflow-hidden rounded-2xl border border-fd-border/70 bg-fd-card/30">
      {/* ── controls: a full-width strip, labels left, choices right ── */}
      <div className="flex flex-col gap-3.5 border-b border-fd-border/60 p-4 sm:p-5">
        <FieldRow label="Style">
          <div className="flex flex-wrap gap-1.5">
            {PRESET_OPTS.map((p) => (
              <Choice key={p.id} active={p.id === preset} onSelect={() => setPreset(p.id)}>
                {p.label}
              </Choice>
            ))}
          </div>
        </FieldRow>

        <FieldRow label="Accent">
          <div
            className={cn("flex flex-wrap gap-1.5", inkPreset && "pointer-events-none opacity-40")}
          >
            {ACCENTS.map((a) => (
              <AccentDot
                key={a.id}
                label={a.label}
                swatch={a.light}
                active={accentChoice === a.id}
                onSelect={() => setAccent(a.id)}
              />
            ))}
          </div>
          {inkPreset ? (
            <p className="mt-1.5 text-[0.68rem] leading-snug text-fd-muted-foreground">
              <code className="text-[0.66rem]">{preset}</code> owns its whole ink set — accent,
              valence, and categories — so a brand accent doesn&apos;t apply here.
            </p>
          ) : (
            accentChoice &&
            presetPinsAccent(preset) && (
              <p className="mt-1.5 text-[0.68rem] leading-snug text-fd-muted-foreground">
                Heads up — <code className="text-[0.66rem]">{preset}</code> pins its own accent, so
                this override is what makes yours win. Its categories derive from your accent.
              </p>
            )
          )}
        </FieldRow>

        <FieldRow label="Output">
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
            <Segmented
              label="Mode"
              value={mode}
              onChange={setMode}
              options={[
                { id: "both", label: "Light + Dark" },
                { id: "light", label: "Light" },
                { id: "dark", label: "Dark" },
              ]}
            />
            <Segmented
              label="Tokens"
              value={include}
              onChange={setInclude}
              options={[
                { id: "color", label: "Colours" },
                { id: "all", label: "All" },
              ]}
            />
            <Segmented
              label="Format"
              value={format}
              onChange={setFormat}
              options={[
                { id: "css", label: "CSS" },
                { id: "js", label: "JS object" },
              ]}
            />
            {format === "css" && (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="mono-label text-[0.56rem]">Scope</span>
                  <input
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    spellCheck={false}
                    aria-label="CSS selector scope"
                    className="h-[1.85rem] w-32 rounded-lg border border-fd-border/70 bg-fd-background/60 px-2.5 font-mono text-[0.72rem] text-fd-foreground outline-none focus:border-fd-primary/50"
                  />
                </label>
                <label className="flex h-[1.85rem] cursor-pointer items-center gap-1.5 text-[0.72rem] text-fd-muted-foreground">
                  <input
                    type="checkbox"
                    checked={annotate}
                    onChange={(e) => setAnnotate(e.target.checked)}
                    className="size-3.5 accent-fd-primary"
                  />
                  Comment tokens
                </label>
              </>
            )}
          </div>
        </FieldRow>
      </div>

      {/* ── preview: a full-width banner, both modes side by side ───── */}
      <div className="grid gap-3 border-b border-fd-border/60 p-4 sm:grid-cols-2 sm:p-5">
        <PreviewPane tone="light" style={lightStyle} label="Light" />
        <PreviewPane tone="dark" style={darkStyle} label="Dark" />
      </div>

      {/* ── output: full width, no inner scroll cap, and long lines wrap
           (annotated "All" lines) so the block never scrolls sideways ── */}
      <div className="token-code p-4 sm:p-5 [&_.fd-scroll-container]:!max-h-none [&_.line]:whitespace-pre-wrap [&_.line]:break-words [&_figure]:!my-0 [&_pre]:!w-full">
        <DynamicCodeBlock
          lang={format === "js" ? "ts" : "css"}
          code={code}
          codeblock={{ title: fileName, keepBackground: false }}
        />
      </div>
    </div>
  );
}

// A labelled control row — mono label on the left (or stacked on mobile), the
// choices filling the rest. Keeps the strip dense and the eye on one column.
function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
      <div className="mono-label shrink-0 pt-1.5 text-[0.56rem] sm:w-[5.5rem]">{label}</div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// A preset/style pill — the one button shape shared across the strip.
function Choice({
  active,
  onSelect,
  children,
}: {
  active: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        "rounded-lg border px-2.5 py-1.5 text-[0.72rem] transition-all duration-200 hover:-translate-y-px",
        active
          ? "border-fd-primary/50 bg-fd-primary/10 text-fd-foreground"
          : "border-fd-border text-fd-muted-foreground hover:border-fd-primary/30 hover:text-fd-foreground",
      )}
    >
      {children}
    </button>
  );
}

function AccentDot({
  label,
  swatch,
  active,
  onSelect,
}: {
  label: string;
  swatch: string | null;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={label}
      onClick={onSelect}
      className={cn(
        "group flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[0.7rem] transition-all duration-200 hover:-translate-y-px",
        active
          ? "border-fd-primary/50 bg-fd-primary/10 text-fd-foreground"
          : "border-fd-border text-fd-muted-foreground hover:border-fd-primary/30 hover:text-fd-foreground",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-3.5 shrink-0 rounded-full ring-1 ring-inset ring-black/15 transition-transform group-hover:scale-110 dark:ring-white/15",
          swatch === null &&
            "bg-[repeating-linear-gradient(45deg,var(--color-fd-muted-foreground)_0_2px,transparent_2px_4px)]",
        )}
        style={swatch ? { background: swatch } : undefined}
      />
      {label}
    </button>
  );
}

// editorial/print/eink pin --mc-accent; mono maps it to the ink. modern + vivid
// leave it free, so only those two show a brand accent without an explicit win.
const PINNED = new Set(["editorial", "mono", "print", "eink"]);
const presetPinsAccent = (preset: string) => PINNED.has(preset);
