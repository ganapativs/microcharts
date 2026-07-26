"use client";
import { Component, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Play, RotateCw } from "lucide-react";
import "@microcharts/react/motion"; // enables `animate` (same import consumers use)
import { cn } from "@/lib/cn";
import { A11yPane } from "./a11y-pane";
import {
  SUMMARY_MODES,
  a11yLines,
  a11yProps,
  injectProps,
  type SummaryMode,
} from "./playground-a11y";
import {
  DEFAULT_FIXTURE,
  DEFAULT_LOCALE,
  DEFAULT_THEME,
  FIXTURES,
  FORMATS,
  LOCALES,
  THEMES,
  PLAIN_SERIES,
  applyFixture,
  formatLines,
  formatOption,
  replaceDataLiteral,
  themeAttr,
  wrapTheme,
  type Theme,
} from "./playground-options";
// Lazy, one chunk per chart — a static `registry` import here would put all 106
// chart modules (each with its interactive twin) in this route's client bundle.
import { useChartModule } from "@/lib/charts/use-chart-module";
import { PLAYGROUND_CAPS } from "@/lib/charts/playground-caps.generated";
import { injectChartProps } from "@/lib/charts/inject-chart-props";
import { interactionKind } from "@/lib/charts/interaction-note";
import { CodeWithData } from "@/components/ui/code-with-data";
import type { ChartModule, Knob, KnobValue, SampleData } from "@/lib/charts/types";

/* ── shared control primitives ─────────────────────────────────────────── */

/** Readout destinations, in the order the reader meets them: the chart's own
 *  chip, the callback panel beside it, then both at once. */
const READOUT_DESTINATIONS = ["chart", "panel", "both"] as const;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="mono-label text-[0.58rem]">{label}</span>
      {children}
    </div>
  );
}

function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="seg w-max">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            data-active={value === o}
            onClick={() => onChange(o)}
            className="seg-opt"
          >
            {o}
          </button>
        ))}
      </div>
    </Field>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Field label={label}>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={cn(
          "relative h-6 w-10 shrink-0 rounded-full border transition-colors",
          value ? "border-fd-primary bg-fd-primary/25" : "border-fd-border bg-fd-muted",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-1/2 size-4 -translate-y-1/2 rounded-full transition-transform duration-200",
            value ? "translate-x-4 bg-fd-primary" : "translate-x-0 bg-fd-muted-foreground",
          )}
        />
      </button>
    </Field>
  );
}

function Range({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={`${label} · ${value}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mc-range h-6 w-32"
      />
    </Field>
  );
}

/** A compact styled dropdown — the requested "pick where the value goes" control. */

/* ── the callback readout — the value, rendered OUTSIDE the chart ──────────── */

/** The payload every `onActive` / `onSelect` hands back (mirrors `MicroDatum`). */
type Datum = { index: number; value: number | null; label?: string; formatted?: string };

/** One logged callback firing. `d === null` is a clear (`onActive(null)` etc.). */
type Ev = { id: number; kind: "active" | "select" | "window"; d: Datum | null };

/** The display string for a datum — its `formatted`, falling back to the raw value. */
const showDatum = (d: Datum): string => d.formatted ?? (d.value === null ? "—" : String(d.value));

/**
 * The external readout — a compact HUD overlay fed purely by the chart's
 * callbacks. This is the whole point of `readout={false}`: the value leaves the
 * chart and is rendered wherever the product wants it.
 *
 * Absolutely positioned top-right so it never shifts the plot container. Body
 * stays `pointer-events-none` (hover passes through to the chart); only the
 * collapse control is clickable. Open by default; collapse to a chip when the
 * panel covers the mark. Value is sticky (last reading dims to `idle`).
 */
function ReadoutTile({
  active,
  selected,
  events,
  label,
  emptyHint = "hover · rove · click…",
}: {
  active: Datum | null;
  selected: Datum | null;
  events: Ev[];
  label: string;
  emptyHint?: string;
}) {
  const [open, setOpen] = useState(true);
  const last = events.find((e) => e.d)?.d ?? null; // most recent non-clear firing
  const shown = active ?? selected ?? last; // sticky: survives pointer-leave
  // Window drags aren't a pinned unit selection — sticky reading stays `idle`.
  const state = active
    ? "live"
    : selected && label !== "onWindowChange"
      ? "pinned"
      : shown
        ? "idle"
        : "empty";
  const value = shown ? showDatum(shown) : null;
  const kindTag = (k: Ev["kind"]): string =>
    k === "window" ? "win" : k === "select" ? "sel" : "act";

  return (
    <div
      className={cn(
        "pointer-events-none absolute right-2.5 top-2.5 z-10 flex flex-col overflow-hidden rounded-lg border border-hairline bg-fd-card/85 text-left shadow-lg backdrop-blur-md transition-[width,max-width] duration-200 ease-out",
        open ? "w-[11.5rem] sm:w-[13rem]" : "w-auto max-w-[11.5rem]",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 pl-2.5 pr-1.5",
          open ? "justify-between pb-0 pt-2" : "h-7",
        )}
      >
        <span className="mono-label min-w-0 flex-1 truncate leading-none text-[0.5rem]">
          {label}
        </span>
        <div className="flex h-5 shrink-0 items-center gap-1">
          {(open || state !== "empty") && (
            <span
              className={cn(
                "flex h-5 items-center gap-1 leading-none text-[0.55rem] font-medium",
                state === "live"
                  ? "text-fd-primary"
                  : state === "pinned"
                    ? "text-fd-foreground/70"
                    : "text-fd-muted-foreground/55",
              )}
            >
              {state === "live" && (
                <span className="size-1 animate-pulse rounded-full bg-fd-primary" />
              )}
              {open
                ? state === "empty"
                  ? "idle"
                  : state
                : state !== "empty" &&
                  state !== "live" && (
                    <span className="size-1 rounded-full bg-fd-muted-foreground/45" />
                  )}
            </span>
          )}
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? `Collapse ${label} panel` : `Expand ${label} panel`}
            onClick={() => setOpen((v) => !v)}
            className="pointer-events-auto flex size-5 shrink-0 items-center justify-center rounded-md text-fd-muted-foreground/70 transition-colors hover:bg-fd-muted/60 hover:text-fd-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-fd-primary/50"
          >
            <ChevronDown
              aria-hidden
              className={cn(
                "size-3.5 shrink-0 transition-transform duration-200 ease-out",
                open && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="pointer-events-none min-h-0 overflow-hidden">
          <div className="flex flex-col gap-0.5 px-2.5 pb-1.5 pt-0.5">
            <span
              className={cn(
                "font-display font-medium leading-tight tracking-tight tabular-nums break-all",
                value && value.length > 12 ? "text-[0.85rem]" : "text-lg leading-none",
                value === null
                  ? "text-fd-muted-foreground/40"
                  : state === "idle"
                    ? "text-fd-foreground/70"
                    : "text-fd-foreground",
              )}
            >
              {value ?? "—"}
            </span>
          </div>

          <ol className="flex flex-col gap-px border-t border-hairline bg-fd-muted/25 px-1.5 py-1">
            {events.length === 0 ? (
              <li className="px-1 py-0.5 text-[0.55rem] italic text-fd-muted-foreground/50">
                {emptyHint}
              </li>
            ) : (
              events.slice(0, 6).map((e, i) => (
                <li
                  key={e.id}
                  className="flex items-center gap-1.5 px-1 text-[0.55rem] leading-snug"
                  style={{ opacity: Math.max(0.4, 1 - i * 0.13) }}
                >
                  <span
                    className={cn(
                      "w-6 shrink-0 font-mono text-[0.5rem] uppercase tracking-wide",
                      e.kind === "active" ? "text-fd-muted-foreground/70" : "text-fd-primary",
                    )}
                  >
                    {kindTag(e.kind)}
                  </span>
                  {e.d ? (
                    <span className="min-w-0 flex-1 truncate font-mono tabular-nums text-fd-foreground/75">
                      {e.kind === "window" ? showDatum(e.d) : `#${e.d.index + 1} ${showDatum(e.d)}`}
                    </span>
                  ) : (
                    <span className="flex-1 truncate font-mono italic text-fd-muted-foreground/50">
                      cleared
                    </span>
                  )}
                </li>
              ))
            )}
          </ol>
        </div>
      </div>
    </div>
  );
}

/** Rewrite a chart's JSX snippet to render its value in an external node — the
    copy-paste form of what the "In the panel" / "Chart + panel" modes show. */
function withCallback(jsx: string, hideChip: boolean, scalar: boolean): string {
  const withProps = injectProps(jsx, [
    hideChip ? "  readout={false}" : null,
    // Pickers stream the hovered unit through `onActive`; scalars only fire
    // `onSelect` (one unit, no rove) — same `datum.formatted` either way.
    scalar
      ? "  onSelect={(d) => setReading(d?.formatted)}"
      : "  onActive={(d) => setReading(d?.formatted)}",
  ]);
  const body = withProps
    .split("\n")
    .map((l) => (l.length ? `  ${l}` : l))
    .join("\n");
  return [
    "const [reading, setReading] = useState<string>();",
    "",
    "<>",
    '  <output>{reading ?? "—"}</output>',
    body,
    "</>",
  ].join("\n");
}

/** Pin `readout={false}` onto a self-closing chart snippet. */
function withReadoutOff(jsx: string): string {
  return injectProps(jsx, ["  readout={false}"]);
}

/* ── shell ──────────────────────────────────────────────────────────────── */

/**
 * Catches a throw from the chart under an edge-case fixture.
 *
 * The Data drawer feeds charts empty series, single points, all-nulls and 300
 * points on purpose — that's the documented contract. If one ever throws, the
 * honest outcome is a visible report in the frame, not a blank route: the
 * playground is where that contract is demonstrated, so a break must be legible
 * rather than fatal.
 */
class PreviewBoundary extends Component<
  { resetKey?: string | undefined; children: ReactNode },
  { error: Error | null; seen: string | undefined }
> {
  override state: { error: Error | null; seen: string | undefined } = {
    error: null,
    seen: this.props.resetKey,
  };

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  /** A new `resetKey` means new props on the chart — give it another go. */
  static getDerivedStateFromProps(
    props: { resetKey?: string | undefined },
    state: { error: Error | null; seen: string | undefined },
  ): { error: null; seen: string | undefined } | null {
    return props.resetKey === state.seen ? null : { error: null, seen: props.resetKey };
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <p className="max-w-sm text-center text-[0.72rem] leading-snug text-fd-muted-foreground">
        This chart threw on the selected series —{" "}
        <span className="font-mono text-fd-foreground/80">{error.message}</span>. That is a library
        bug, not a rendering trick; every other option in this playground still works.
      </p>
    );
  }
}

/**
 * One collapsed axis of the playground. Everything past the chart's own knobs
 * lives in these — a reader meets the chart, its props and its code first, and
 * opens data shape / formatting / theme / the screen reader only when that's
 * the question they came with.
 */
export interface Drawer {
  key: string;
  label: string;
  /** Shown on the closed chip when this axis is off its default. */
  badge?: string | undefined;
  content: ReactNode;
}

/** A note under a drawer's controls — what the option actually proves. */
function DrawerNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2.5 max-w-prose text-[0.72rem] leading-snug text-fd-muted-foreground">
      {children}
    </p>
  );
}

function Drawers({ drawers, onReset }: { drawers: Drawer[]; onReset?: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const paneId = useId();
  const shown = drawers.find((d) => d.key === open);
  const dirty = drawers.some((d) => d.badge);
  return (
    <div className="border-t border-hairline">
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-2">
        {drawers.map((d) => (
          <button
            key={d.key}
            type="button"
            aria-expanded={open === d.key}
            aria-controls={open === d.key ? paneId : undefined}
            data-active={open === d.key}
            onClick={() => setOpen((o) => (o === d.key ? null : d.key))}
            className="group flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1 text-[0.7rem] text-fd-muted-foreground transition-colors hover:bg-fd-muted/60 hover:text-fd-foreground data-[active=true]:border-fd-primary/30 data-[active=true]:bg-fd-primary/[0.06] data-[active=true]:text-fd-foreground"
          >
            {d.label}
            {d.badge && (
              <span className="rounded bg-fd-primary/10 px-1 font-mono text-[0.55rem] leading-[1.5] text-fd-primary">
                {d.badge}
              </span>
            )}
            <ChevronDown
              aria-hidden
              className={cn(
                "size-3 shrink-0 opacity-50 transition-transform duration-200",
                open === d.key && "rotate-180",
              )}
            />
          </button>
        ))}
        {/* One way back to the chart as documented — otherwise a reader who has
            wandered through four axes has to remember each default. */}
        {dirty && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="ml-auto rounded-md px-2 py-1 text-[0.68rem] text-fd-muted-foreground transition-colors hover:bg-fd-muted/60 hover:text-fd-foreground"
          >
            Reset
          </button>
        )}
      </div>
      {shown && (
        <div id={paneId} className="border-t border-hairline">
          {shown.content}
        </div>
      )}
    </div>
  );
}

function Shell({
  onShuffle,
  onReplay,
  mode,
  onMode,
  preview,
  aside,
  hint,
  controls,
  drawers,
  code,
  sampleData,
  morphKey,
  previewRef,
  themeScope,
  onReset,
}: {
  onShuffle?: () => void;
  /** Present ⇒ a replay control re-runs the entrance motion. */
  onReplay?: () => void;
  /** Present ⇒ the static ↔ interactive mode switch. */
  mode?: "static" | "interactive";
  onMode?: (m: "static" | "interactive") => void;
  preview: ReactNode;
  /** Present ⇒ a panel beside the chart (the external callback readout). */
  aside?: ReactNode;
  hint?: string;
  controls: ReactNode;
  /** Collapsed axes — data shape, formatting, theme, screen reader. */
  drawers?: Drawer[];
  code: string;
  sampleData?: SampleData[];
  /** Replays a gentle morph when this changes — pass only discrete props, never
      slider values, so dragging doesn't strobe. */
  morphKey?: string;
  /** Host the a11y probe observes; wraps the rendered chart only. */
  previewRef?: React.RefObject<HTMLDivElement | null>;
  /** `data-mc-theme` value for the preview scope; omitted for the default preset. */
  themeScope?: string | undefined;
  /** Puts every drawer axis back to the chart's documented defaults. */
  onReset?: () => void;
}) {
  return (
    <div className="panel not-prose my-6 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
        <span className="mono-label">Live playground</span>
        <div className="flex items-center gap-2">
          {onReplay && (
            <button
              type="button"
              onClick={onReplay}
              aria-label="Replay entrance motion"
              title="Replay entrance motion"
              className="ghost-ctrl size-8"
            >
              <Play className="size-4" />
            </button>
          )}
          {onShuffle && (
            <button
              type="button"
              onClick={onShuffle}
              aria-label="Shuffle data"
              title="Shuffle data"
              className="ghost-ctrl size-8"
            >
              <RotateCw className="size-4" />
            </button>
          )}
        </div>
      </div>
      {/* `relative` so the readout overlay floats out of flow — the chart stays
          centered and the container height never shifts on hover or when
          switching static ↔ interactive. */}
      {/* FIXED height, not min-height: the interactive picker wrapper and the
          static SVG occupy different-sized boxes (fit-content vs fill), so a
          content-driven height would jump on the mode switch. A fixed frame with
          the chart centered keeps the container identical across static ↔
          interactive AND while the overlay's log fills. */}
      <div className="grid-paper relative flex h-52 items-center justify-center px-6 py-8">
        {/* `data-mc-theme` scopes a preset to this chart only — the same
            attribute `MicroProvider` sets, so nothing docs-only is in play. */}
        <div
          key={morphKey}
          ref={previewRef}
          data-mc-theme={themeScope}
          className="mc-morph flex w-full items-center justify-center"
        >
          <PreviewBoundary resetKey={morphKey}>{preview}</PreviewBoundary>
        </div>
        {aside}
      </div>
      {mode && onMode && (
        <p
          title={mode === "interactive" ? hint : undefined}
          className="truncate border-t border-hairline px-4 py-2 text-center text-[0.72rem] leading-snug text-fd-muted-foreground"
        >
          {mode === "interactive"
            ? (hint ?? "Hover or focus the chart — values are read out as you move.")
            : "Static render — switch to Interactive for hover · keyboard · live values."}
        </p>
      )}
      {mode && onMode && (
        <div
          role="radiogroup"
          aria-label="Chart entry"
          className="grid grid-cols-2 border-t border-hairline"
        >
          {(
            [
              ["interactive", "Interactive", "hover · keyboard · live values"],
              ["static", "Static", "pure SVG · zero client JS"],
            ] as const
          ).map(([m, label, caption]) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              data-active={mode === m}
              onClick={() => onMode(m)}
              className="group flex flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors first:border-r first:border-hairline hover:bg-fd-muted/60 data-[active=true]:bg-fd-primary/[0.05] data-[active=true]:shadow-[inset_0_2px_0_var(--accent)]"
            >
              <span className="text-[0.82rem] font-medium text-fd-muted-foreground transition-colors group-hover:text-fd-foreground group-data-[active=true]:text-fd-foreground">
                {label}
              </span>
              <span className="mono-label text-[0.55rem] opacity-60">{caption}</span>
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4 border-t border-hairline px-4 py-4">
        {controls}
      </div>
      {drawers?.length ? <Drawers drawers={drawers} onReset={onReset} /> : null}
      <CodeWithData code={code} sampleData={sampleData} className="border-t border-hairline" />
    </div>
  );
}

/* ── the engine — interprets a chart module's declarative PlaygroundSpec ── */

function KnobControl({
  knob,
  value,
  onChange,
}: {
  knob: Knob;
  value: KnobValue;
  onChange: (v: KnobValue) => void;
}) {
  const label = knob.label ?? knob.key;
  switch (knob.kind) {
    case "segmented":
      return (
        <Segmented
          label={label}
          value={value as string}
          options={knob.options}
          onChange={onChange}
        />
      );
    case "toggle":
      return <Toggle label={label} value={value as boolean} onChange={onChange} />;
    case "range":
      return (
        <Range
          label={label}
          value={value as number}
          min={knob.min}
          max={knob.max}
          step={knob.step}
          onChange={onChange}
        />
      );
  }
}

/**
 * The unified live playground for any chart: props, static ↔ interactive mode,
 * opt-in entrance motion with replay, and a copy-complete snippet that tracks
 * every toggle. `<Playground chart="bullet" />`
 *
 * The module resolves LAZILY, one chunk per chart — every knob's initial state
 * is derived from `mod.playground`, so the view only mounts once that has landed
 * (the loader keys it by slug, so the initializers re-run on a chart change).
 */
export function Playground({ chart }: { chart: string }) {
  const mod = useChartModule(chart);
  // Reserve the playground's resolved height so the swap causes no layout shift.
  if (!mod) return <div className="not-prose my-6 min-h-[26rem]" aria-hidden />;
  return <PlaygroundView key={chart} mod={mod} />;
}

function PlaygroundView({ mod }: { mod: ChartModule }) {
  const spec = mod.playground;
  const entry = mod.entry;
  const [state, setState] = useState<Record<string, KnobValue>>(() =>
    Object.fromEntries((spec?.knobs ?? []).map((k) => [k.key, k.init])),
  );
  const [data, setData] = useState<number[]>(spec?.data ?? []);
  const [seed, setSeed] = useState(1);
  const [mode, setMode] = useState<"static" | "interactive">(() =>
    spec.renderInteractive ? "interactive" : "static",
  );
  const [animate, setAnimate] = useState(false);
  const [take, setTake] = useState(0);
  // The chart's callbacks, surfaced live in the tile beside it, plus a rolling
  // log of the last few firings so the stream stays readable after mouse-out.
  const [active, setActive] = useState<Datum | null>(null);
  const [selected, setSelected] = useState<Datum | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);
  const evId = useRef(0);
  // Where the value is shown: on the chart's own chip, in the external tile, or both.
  const [dest, setDest] = useState<"chart" | "panel" | "both">("chart");
  // Scalar chip on/off (pickers use `dest` instead).
  const [chipOn, setChipOn] = useState(true);
  // Naming knobs — how the chart is announced (see the screen-reader pane).
  const [summaryMode, setSummaryMode] = useState<SummaryMode>("auto");
  // Default OFF. The snippet a reader copies has to be the chart's own; a
  // `title` the playground injected by default put a prop in every code block
  // that nobody asked for. Switching it on injects a real title AND prints it.
  const [named, setNamed] = useState(false);
  const [byId, setById] = useState(false);
  // The three collapsed axes: the shape of the data, how numbers read, and
  // which token bundle paints the marks.
  const [fixture, setFixture] = useState(DEFAULT_FIXTURE);
  const [formatKey, setFormatKey] = useState(FORMATS[0]!.key);
  const [locale, setLocale] = useState<string>(DEFAULT_LOCALE);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const previewRef = useRef<HTMLDivElement>(null);
  if (!spec || !entry) return null;

  const logEvent = (kind: Ev["kind"], d: Datum | null): void =>
    setEvents((es) => [{ id: evId.current++, kind, d }, ...es].slice(0, 6));
  const onActiveCb = (d: Datum | null): void => {
    setActive(d);
    logEvent("active", d);
  };
  const onSelectCb = (d: Datum | null): void => {
    setSelected(d);
    logEvent("select", d);
  };

  const interactive = mode === "interactive" && !!spec.renderInteractive;
  const canAnimate = interactive && spec.animates !== false;
  const ui = { animate: canAnimate && animate };
  // Match the published interaction contract: pickers stream `onActive` + pin
  // via `onSelect`; lean scalars fire both on the single unit (hover/focus →
  // `onActive`, click/Enter → `onSelect`). TokenConfidence has no callback tile;
  // MinimapStrip surfaces `onWindowChange` instead of the shared picker props.
  const kind = interactionKind(entry);
  const isMinimap = entry.slug === "minimap-strip";
  const scalar = kind === "single";
  const isPicker = kind === "picker";
  const showCallbacks = isPicker || scalar || isMinimap;
  // Any chart that paints `.mc-spark-readout` exposes a control to hide it.
  // Pickers get chart/panel/both; scalars + exceptions get an on/off toggle.
  const hasChip = entry.readout !== false;
  const showReadoutPicker = interactive && hasChip && isPicker;
  const showReadoutToggle = interactive && hasChip && !isPicker;
  const clearCallbacks = (): void => {
    setActive(null);
    setSelected(null);
    setEvents([]);
  };
  const onWindowChangeCb = (win: [number, number]): void => {
    const lo = Math.round(win[0]);
    const hi = Math.round(win[1]);
    const d: Datum = { index: 0, value: lo, formatted: `${lo}–${hi}` };
    setSelected(d);
    logEvent("window", d);
  };

  // The series the chart actually renders.
  //
  // Two routes to a fixture. Specs that thread `data` get it through `render`
  // (the snippet then prints it for free). Specs that hard-code their series
  // still take one IF the chart's data is a plain numeric array — the fixture
  // rides in as a real `data` prop and the snippet's literal is rewritten to
  // match. Everything else (paired arms, `{label,value}[]`, OHLC candles, …) has
  // no honest generic reshape, so those charts show no Data drawer; their page's
  // own "Edge cases" section carries the contract instead.
  //
  // WHICH options are offered is not guessed here: `playground-caps.generated`
  // is produced by rendering every chart with every option and keeping only the
  // ones that provably changed its markup (scripts/gen-playground-caps.mjs). A
  // control that would do nothing on this chart is never drawn.
  const caps = PLAYGROUND_CAPS[entry.slug];
  // A chart whose own knobs already drive `format`/`locale` must not get a
  // second control for the same prop — two widgets writing one prop is the
  // playground lying about which one won.
  const knobKeys = new Set(spec.knobs.map((k) => k.key));
  const offerFormat = !!caps?.format && !knobKeys.has("format");
  const offerLocale = !!caps?.locale && !knobKeys.has("locale");
  const threadsData = !!spec.data;
  const injectsData = !threadsData && PLAIN_SERIES.test(entry.dataShape) && entry.demo.length > 0;
  const canFixture = (threadsData || injectsData) && !!caps?.fixtures.length;
  const fixtureSeries = canFixture
    ? applyFixture(fixture, threadsData ? data : entry.demo)
    : undefined;
  const shown = (threadsData ? (fixtureSeries ?? data) : data) as number[];
  const dataOverride =
    injectsData && fixture !== DEFAULT_FIXTURE ? (fixtureSeries as (number | null)[]) : undefined;

  // Remount on discrete knobs / data / mode — not on slider drags.
  const morphKey = spec.knobs
    .filter((k) => k.kind !== "range")
    .map((k) => String(state[k.key]))
    .concat(spec.shuffle ? [String(seed)] : [])
    .concat([
      mode,
      String(animate),
      String(take),
      String(chipOn),
      summaryMode,
      String(named),
      String(byId),
      fixture,
      formatKey,
      locale,
      theme,
    ])
    .join("-");

  const importPath = interactive
    ? (entry.interactiveImport ?? entry.staticImport)
    : entry.staticImport;

  // Inject live callbacks (+ readout/naming) onto the chart element — not a
  // host wrapper. Delta (and any future sized wrapper) nests the chart in a
  // `<span>`; shallow clone would leave onSelect hanging on the span.
  const showChip = dest !== "panel";
  const rawPreview = interactive
    ? spec.renderInteractive!(state, shown, ui)
    : spec.render(state, shown);
  const cbProps: Record<string, unknown> = {};
  if (interactive) {
    if (isMinimap) cbProps.onWindowChange = onWindowChangeCb;
    else if (showCallbacks) {
      cbProps.onSelect = onSelectCb;
      cbProps.onActive = onActiveCb;
    }
    if (hasChip) cbProps.readout = isPicker ? showChip : chipOn;
  }
  // `id` naming (<title>/<desc> + aria-labelledby) is a STATIC-entry mode: the
  // interactive wrapper owns the name and generates its ids with `useId`.
  const naming = a11yProps(
    summaryMode,
    named && !!caps?.title,
    byId && !interactive && !!caps?.idNaming,
    entry,
  );
  const fmt = formatOption(formatKey);
  const numbers: Record<string, unknown> = {};
  if (fmt.value) numbers.format = fmt.value;
  if (locale !== DEFAULT_LOCALE) numbers.locale = locale;
  const preview = injectChartProps(rawPreview, {
    ...(interactive ? cbProps : {}),
    ...naming,
    ...numbers,
    ...(dataOverride ? { data: dataOverride } : {}),
  });

  // The snippet mirrors what's on screen: when the value lives in the panel, show
  // the real `readout={false}` + callback → external-node pattern.
  const external = showReadoutPicker && dest !== "chart";
  const baseJsx = interactive
    ? (spec.codeInteractive?.(state, shown, ui) ?? spec.code(state, shown))
    : spec.code(state, shown);
  const withData = dataOverride ? replaceDataLiteral(baseJsx, dataOverride) : baseJsx;
  const chartJsx = injectProps(withData, [
    ...a11yLines(naming, withData),
    ...formatLines(formatKey, locale, withData),
  ]);
  const winAt = (state.window as number | undefined) ?? 520;
  // Snippet mirrors the live tile: pickers show `onActive` when the value is
  // read in the panel; scalars always show `onSelect` (the tile is always on).
  const jsx = isMinimap
    ? [
        `const [viewport, setViewport] = useState<[number, number]>([${winAt}, ${winAt + 140}]);`,
        "",
        chartJsx,
      ].join("\n")
    : external
      ? withCallback(chartJsx, dest === "panel", false)
      : // The callback pattern is a PRODUCT feature — "render the reading in my
        // own UI" — not something every consumer needs, so it only appears once
        // the reader turns the in-chart chip off. Printing `useState` +
        // `<output>` in the default snippet put wiring nobody asked for into the
        // code a reader copies.
        showReadoutToggle && !chipOn
        ? scalar && interactive
          ? withCallback(chartJsx, true, true)
          : withReadoutOff(chartJsx)
        : chartJsx;
  const code = [
    `import { ${entry.name} } from "${importPath}";`,
    ...(theme !== DEFAULT_THEME ? ['import { MicroProvider } from "@microcharts/react";'] : []),
    ...(external || isMinimap || (scalar && interactive && showReadoutToggle && !chipOn)
      ? ['import { useState } from "react";']
      : []),
    ...(ui.animate ? ['import "@microcharts/react/motion";'] : []),
    "",
    wrapTheme(jsx, theme),
  ].join("\n");

  return (
    <Shell
      morphKey={morphKey}
      mode={spec.renderInteractive ? mode : undefined}
      onMode={
        spec.renderInteractive
          ? (m) => {
              clearCallbacks();
              setMode(m);
            }
          : undefined
      }
      onReplay={ui.animate ? () => setTake((t) => t + 1) : undefined}
      onShuffle={
        spec.shuffle
          ? () => {
              setData(spec.shuffle!(seed));
              setSeed((s) => s + 1);
            }
          : undefined
      }
      sampleData={mod?.entry.sampleData}
      preview={preview}
      aside={
        interactive && showCallbacks ? (
          <ReadoutTile
            active={active}
            selected={selected}
            events={events}
            label={isMinimap ? "onWindowChange" : scalar ? "onSelect" : "onActive"}
            emptyHint={
              isMinimap ? "drag · click · ←/→…" : scalar ? "hover · click · Enter…" : undefined
            }
          />
        ) : undefined
      }
      hint={spec.interactiveHint}
      themeScope={themeAttr(theme)}
      controls={
        <>
          {spec.knobs.map((k) => (
            <KnobControl
              key={k.key}
              knob={k}
              value={state[k.key]!}
              onChange={(v) => setState((s) => ({ ...s, [k.key]: v }))}
            />
          ))}
          {/* Where the value is read out. A segmented control, not a select:
              every other knob in this row is one, and the three destinations are
              short enough to show at once — which also makes the choice visible
              instead of hidden behind a closed dropdown. `showReadoutToggle` is
              the mutually-exclusive branch, so "readout" cannot label two
              controls at the same time. */}
          {showReadoutPicker && (
            <Segmented
              label="readout"
              value={dest}
              options={READOUT_DESTINATIONS}
              onChange={(v) => setDest(v as "chart" | "panel" | "both")}
            />
          )}
          {showReadoutToggle && <Toggle label="readout chip" value={chipOn} onChange={setChipOn} />}
          {canAnimate && <Toggle label="animate" value={animate} onChange={setAnimate} />}
        </>
      }
      drawers={[
        // The chart's own knobs stay above; these four are the axes every chart
        // shares, collapsed so the default view is the chart and its code.
        ...(canFixture
          ? [
              {
                key: "data",
                label: "Data",
                badge: fixture === DEFAULT_FIXTURE ? undefined : fixture,
                content: (
                  <div className="px-4 py-3">
                    <Segmented
                      label="series"
                      value={fixture}
                      // Only the fixtures that provably change THIS chart.
                      options={[DEFAULT_FIXTURE, ...(caps?.fixtures ?? [])]}
                      onChange={setFixture}
                    />
                    <DrawerNote>
                      {FIXTURES.find((f) => f.key === fixture)?.note} This is the live component on
                      that series — the documented edge-case behaviour, not a mock.
                    </DrawerNote>
                  </div>
                ),
              },
            ]
          : []),
        ...(offerFormat || offerLocale
          ? [
              {
                key: "format",
                label: "Numbers",
                badge:
                  formatKey === FORMATS[0]!.key && locale === DEFAULT_LOCALE
                    ? undefined
                    : `${formatKey === FORMATS[0]!.key ? "" : formatKey}${
                        locale === DEFAULT_LOCALE ? "" : ` ${locale}`
                      }`.trim(),
                content: (
                  <div className="flex flex-wrap items-start gap-x-6 gap-y-4 px-4 py-3">
                    {offerFormat && (
                      <Segmented
                        label="format"
                        value={formatKey}
                        options={FORMATS.map((f) => f.key)}
                        onChange={setFormatKey}
                      />
                    )}
                    {offerLocale && (
                      <Segmented
                        label="locale"
                        value={locale}
                        options={LOCALES}
                        onChange={setLocale}
                      />
                    )}
                    <DrawerNote>
                      {offerFormat ? (
                        <>
                          <code className="text-xs">format</code> takes{" "}
                          <code className="text-xs">Intl.NumberFormat</code> options (or your own
                          function)
                          {offerLocale ? ", and " : ". "}
                        </>
                      ) : (
                        <>
                          This chart&apos;s numbers are percentages, formatted by the library — no{" "}
                          <code className="text-xs">format</code> override applies, but{" "}
                        </>
                      )}
                      {offerLocale && (
                        <>
                          <code className="text-xs">locale</code> a BCP-47 tag.{" "}
                        </>
                      )}
                      Both flow through every painted number, the hover readout AND the
                      screen-reader announcement — one prop, not three.
                    </DrawerNote>
                  </div>
                ),
              },
            ]
          : []),
        {
          key: "theme",
          label: "Theme",
          badge: theme === DEFAULT_THEME ? undefined : theme,
          content: (
            <div className="px-4 py-3">
              <Segmented
                label="preset"
                value={theme}
                options={THEMES}
                onChange={(v) => setTheme(v as Theme)}
              />
              <DrawerNote>
                Presets are token bundles in <code className="text-xs">styles.css</code>, scoped by{" "}
                <code className="text-xs">data-mc-theme</code> — exactly what{" "}
                <code className="text-xs">MicroProvider</code> renders. They are visual only: no
                preset ever changes what the data means. Per-token control lives on{" "}
                <Link prefetch={false} href="/docs/theming" className="underline">
                  Theming
                </Link>
                .
              </DrawerNote>
            </div>
          ),
        },
        {
          key: "a11y",
          label: "Screen reader",
          // Badges mark an axis that is OFF its default — the defaults being
          // "the library's own naming, the chart's own title".
          badge:
            summaryMode !== "auto"
              ? `summary ${summaryMode}`
              : byId
                ? "id naming"
                : named
                  ? "title"
                  : undefined,
          content: (
            <A11yPane
              chartRef={previewRef}
              probeKey={morphKey}
              interactive={interactive}
              // Pickers announce every unit you rove to; lean scalars announce on
              // value change; the range primitive announces no unit at all.
              announce={isPicker ? "rove" : scalar ? "scalar" : "none"}
              hint={spec.interactiveHint}
              controls={
                <>
                  {/* `summary` is the accessible description (auto = describeSeries,
                      off = decorative); `title` names the chart; `id` switches the
                      static entry to <title>/<desc> + aria-labelledby. */}
                  {caps?.summary && (
                    <Segmented
                      label="summary"
                      value={summaryMode}
                      options={SUMMARY_MODES}
                      onChange={(v) => setSummaryMode(v as SummaryMode)}
                    />
                  )}
                  {caps?.title && <Toggle label="title" value={named} onChange={setNamed} />}
                  {/* `id` naming is a static-entry mode, and Delta and
                      TokenConfidence render inline HTML instead of <Chart> — so
                      neither has a <title>/<desc> pair to point at. */}
                  {!interactive && caps?.idNaming && (
                    <Toggle label="id naming" value={byId} onChange={setById} />
                  )}
                </>
              }
            />
          ),
        },
      ]}
      previewRef={previewRef}
      onReset={() => {
        setFixture(DEFAULT_FIXTURE);
        setFormatKey(FORMATS[0]!.key);
        setLocale(DEFAULT_LOCALE);
        setTheme(DEFAULT_THEME);
        setSummaryMode("auto");
        setNamed(false);
        setById(false);
      }}
      code={code}
    />
  );
}
