"use client";
import { cloneElement, isValidElement, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Play, RotateCw } from "lucide-react";
import "@microcharts/react/motion"; // enables `animate` (same import consumers use)
import { cn } from "@/lib/cn";
// Lazy, one chunk per chart — a static `registry` import here would put all 106
// chart modules (each with its interactive twin) in this route's client bundle.
import { useChartModule } from "@/lib/charts/use-chart-module";
import { CodeWithData } from "@/components/ui/code-with-data";
import type { ChartModule, Knob, KnobValue, SampleData } from "@/lib/charts/types";

/* ── shared control primitives ─────────────────────────────────────────── */

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
function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="relative w-max">
        <select
          value={value}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 cursor-pointer appearance-none rounded-md border border-fd-border bg-fd-background py-0 pl-2.5 pr-7 text-[0.8rem] text-fd-foreground transition-colors hover:border-fd-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/40"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 opacity-60" />
      </div>
    </Field>
  );
}

/* ── the callback readout — the value, rendered OUTSIDE the chart ──────────── */

/** The payload every `onActive` / `onSelect` hands back (mirrors `MicroDatum`). */
type Datum = { index: number; value: number | null; label?: string; formatted?: string };

/** One logged callback firing. `d === null` is a clear (`onActive(null)` etc.). */
type Ev = { id: number; kind: "active" | "select"; d: Datum | null };

/** The display string for a datum — its `formatted`, falling back to the raw value. */
const showDatum = (d: Datum): string => d.formatted ?? (d.value === null ? "—" : String(d.value));

/**
 * The external readout — a compact HUD overlay fed purely by the chart's
 * callbacks. This is the whole point of `readout={false}`: the value leaves the
 * chart and is rendered wherever the product wants it.
 *
 * It is ABSOLUTELY positioned (top-right, `pointer-events-none`) so it floats
 * over the plot without ever changing the container's height — no shift on hover
 * or when switching static ↔ interactive — and never blocks a hover underneath
 * it. The value is STICKY (keeps the last reading, dimming to `idle`, rather
 * than blanking on mouse-out) and a short log keeps recent firings readable.
 */
function ReadoutTile({
  active,
  selected,
  events,
  scalar,
}: {
  active: Datum | null;
  selected: Datum | null;
  events: Ev[];
  scalar: boolean;
}) {
  const last = events.find((e) => e.d)?.d ?? null; // most recent non-clear firing
  const shown = active ?? selected ?? last; // sticky: survives pointer-leave
  const state = active ? "live" : selected ? "pinned" : shown ? "idle" : "empty";
  const value = shown ? showDatum(shown) : null;

  return (
    <div className="pointer-events-none absolute right-2.5 top-2.5 z-10 flex w-[9.5rem] flex-col overflow-hidden rounded-lg border border-hairline bg-fd-card/85 text-left shadow-lg backdrop-blur-md sm:w-[11rem]">
      {/* compact value header */}
      <div className="flex flex-col gap-0.5 px-2.5 pb-1.5 pt-2">
        <div className="flex items-center justify-between gap-1">
          <span className="mono-label text-[0.5rem]">{scalar ? "onSelect" : "onActive"}</span>
          <span
            className={cn(
              "flex items-center gap-1 text-[0.55rem] font-medium",
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
            {state === "empty" ? "idle" : state}
          </span>
        </div>
        <span
          className={cn(
            "font-display font-medium leading-tight tracking-tight tabular-nums break-words",
            value && value.length > 10 ? "text-[0.9rem]" : "text-lg leading-none",
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

      {/* Event log — the last firings, so the stream stays readable after
          mouse-out. Fixed row budget → the overlay never grows the container. */}
      <ol className="flex flex-col gap-px border-t border-hairline bg-fd-muted/25 px-1.5 py-1">
        {events.length === 0 ? (
          <li className="px-1 py-0.5 text-[0.55rem] italic text-fd-muted-foreground/50">
            hover · rove · click…
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
                  e.kind === "select" ? "text-fd-primary" : "text-fd-muted-foreground/70",
                )}
              >
                {e.kind === "select" ? "sel" : "act"}
              </span>
              {e.d ? (
                <span className="flex-1 truncate font-mono tabular-nums text-fd-foreground/75">
                  #{e.d.index + 1} {showDatum(e.d)}
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
  );
}

/** Rewrite a chart's JSX snippet to render its value in an external node — the
    copy-paste form of what the "In the panel" / "Chart + panel" modes show. */
function withCallback(jsx: string, hideChip: boolean): string {
  const extra = [
    hideChip ? "  readout={false}" : null,
    "  onActive={(d) => setReading(d?.formatted)}",
  ]
    .filter(Boolean)
    .join("\n");
  // Inject before the single element's self-closing `/>`; no-op if it isn't one.
  const withProps = jsx.replace(/\n?\/>\s*$/, `\n${extra}\n/>`);
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

/* ── shell ──────────────────────────────────────────────────────────────── */

function Shell({
  onShuffle,
  onReplay,
  mode,
  onMode,
  preview,
  aside,
  hint,
  controls,
  code,
  sampleData,
  morphKey,
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
  code: string;
  sampleData?: SampleData[];
  /** Replays a gentle morph when this changes — pass only discrete props, never
      slider values, so dragging doesn't strobe. */
  morphKey?: string;
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
        <div key={morphKey} className="mc-morph flex w-full items-center justify-center">
          {preview}
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
  if (!spec || !entry) return null;

  const logEvent = (kind: "active" | "select", d: Datum | null): void =>
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
  // `picker: false` charts have one whole-chart selection (onSelect only); every
  // multi-unit chart also streams the hovered/focused unit through onActive.
  const scalar = entry.picker === false;
  // Only picker charts expose the readout dropdown — a scalar without a chip has
  // no chip to hide, and injecting `readout` there would leak an unknown prop.
  const showReadoutPicker = interactive && !scalar;
  const clearCallbacks = (): void => {
    setActive(null);
    setSelected(null);
    setEvents([]);
  };

  // Remount on discrete knobs / data / mode — not on slider drags.
  const morphKey = spec.knobs
    .filter((k) => k.kind !== "range")
    .map((k) => String(state[k.key]))
    .concat(spec.shuffle ? [String(seed)] : [])
    .concat([mode, String(animate), String(take)])
    .join("-");

  const importPath = interactive
    ? (entry.interactiveImport ?? entry.staticImport)
    : entry.staticImport;

  // Inject the live callbacks (and `readout`) onto whatever element the chart's
  // renderInteractive produced — one clone, uniform across all 106 charts, so no
  // per-chart registry wiring is needed.
  const showChip = dest !== "panel";
  const rawPreview = interactive
    ? spec.renderInteractive!(state, data, ui)
    : spec.render(state, data);
  const cbProps: Record<string, unknown> = {};
  if (interactive) {
    cbProps.onSelect = onSelectCb;
    if (!scalar) {
      cbProps.onActive = onActiveCb;
      cbProps.readout = showChip;
    }
  }
  const preview =
    interactive && isValidElement(rawPreview) ? cloneElement(rawPreview, cbProps) : rawPreview;

  // The snippet mirrors what's on screen: when the value lives in the panel, show
  // the real `readout={false}` + `onActive` → external-node pattern.
  const external = showReadoutPicker && dest !== "chart";
  const chartJsx = interactive
    ? (spec.codeInteractive?.(state, data, ui) ?? spec.code(state, data))
    : spec.code(state, data);
  const jsx = external ? withCallback(chartJsx, dest === "panel") : chartJsx;
  const code = [
    `import { ${entry.name} } from "${importPath}";`,
    ...(external ? ['import { useState } from "react";'] : []),
    ...(ui.animate ? ['import "@microcharts/react/motion";'] : []),
    "",
    jsx,
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
        interactive ? (
          <ReadoutTile active={active} selected={selected} events={events} scalar={scalar} />
        ) : undefined
      }
      hint={spec.interactiveHint}
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
          {showReadoutPicker && (
            <Select
              label="value readout"
              value={dest}
              options={[
                { value: "chart", label: "On the chart" },
                { value: "panel", label: "In the panel" },
                { value: "both", label: "Chart + panel" },
              ]}
              onChange={(v) => setDest(v as "chart" | "panel" | "both")}
            />
          )}
          {canAnimate && <Toggle label="animate" value={animate} onChange={setAnimate} />}
        </>
      }
      code={code}
    />
  );
}
