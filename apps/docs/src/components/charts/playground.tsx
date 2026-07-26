"use client";
import { cloneElement, isValidElement, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Play, RotateCw } from "lucide-react";
import "@microcharts/react/motion"; // enables `animate` (same import consumers use)
import { cn } from "@/lib/cn";
// Lazy, one chunk per chart — a static `registry` import here would put all 106
// chart modules (each with its interactive twin) in this route's client bundle.
import { useChartModule } from "@/lib/charts/use-chart-module";
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
  const extra = [
    hideChip ? "  readout={false}" : null,
    // Pickers stream the hovered unit through `onActive`; scalars only fire
    // `onSelect` (one unit, no rove) — same `datum.formatted` either way.
    scalar
      ? "  onSelect={(d) => setReading(d?.formatted)}"
      : "  onActive={(d) => setReading(d?.formatted)}",
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

/** Pin `readout={false}` onto a self-closing chart snippet. */
function withReadoutOff(jsx: string): string {
  return jsx.replace(/\n?\/>\s*$/, `\n  readout={false}\n/>`);
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
  // Scalar chip on/off (pickers use `dest` instead).
  const [chipOn, setChipOn] = useState(true);
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
  // Match the published interaction contract: pickers stream `onActive`, lean
  // scalars fire `onSelect`. TokenConfidence has no callback tile; MinimapStrip
  // surfaces its own `onWindowChange` instead of the shared picker props.
  const kind = interactionKind(entry);
  const isMinimap = entry.slug === "minimap-strip";
  const scalar = kind === "single";
  const streamActive = kind === "picker";
  const showCallbacks = kind === "picker" || kind === "single" || isMinimap;
  // Any chart that paints `.mc-spark-readout` exposes a control to hide it.
  // Pickers get chart/panel/both; scalars + exceptions get an on/off toggle.
  const hasChip = entry.readout !== false;
  const showReadoutPicker = interactive && hasChip && streamActive;
  const showReadoutToggle = interactive && hasChip && !streamActive;
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

  // Remount on discrete knobs / data / mode — not on slider drags.
  const morphKey = spec.knobs
    .filter((k) => k.kind !== "range")
    .map((k) => String(state[k.key]))
    .concat(spec.shuffle ? [String(seed)] : [])
    .concat([mode, String(animate), String(take), String(chipOn)])
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
    if (isMinimap) cbProps.onWindowChange = onWindowChangeCb;
    else if (showCallbacks) {
      cbProps.onSelect = onSelectCb;
      if (streamActive) cbProps.onActive = onActiveCb;
    }
    if (hasChip) cbProps.readout = streamActive ? showChip : chipOn;
  }
  const preview =
    interactive && isValidElement(rawPreview) ? cloneElement(rawPreview, cbProps) : rawPreview;

  // The snippet mirrors what's on screen: when the value lives in the panel, show
  // the real `readout={false}` + callback → external-node pattern.
  const external = showReadoutPicker && dest !== "chart";
  const chartJsx = interactive
    ? (spec.codeInteractive?.(state, data, ui) ?? spec.code(state, data))
    : spec.code(state, data);
  const winAt = (state.window as number | undefined) ?? 520;
  const jsx = isMinimap
    ? [
        `const [viewport, setViewport] = useState<[number, number]>([${winAt}, ${winAt + 140}]);`,
        "",
        chartJsx,
      ].join("\n")
    : external
      ? withCallback(chartJsx, dest === "panel", false)
      : showReadoutToggle && !chipOn
        ? withReadoutOff(chartJsx)
        : chartJsx;
  const code = [
    `import { ${entry.name} } from "${importPath}";`,
    ...(external || isMinimap ? ['import { useState } from "react";'] : []),
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
        interactive && showCallbacks ? (
          <ReadoutTile
            active={active}
            selected={selected}
            events={events}
            label={isMinimap ? "onWindowChange" : scalar ? "onSelect" : "onActive"}
            emptyHint={isMinimap ? "drag · click · ←/→…" : undefined}
          />
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
      code={code}
    />
  );
}
