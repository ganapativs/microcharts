"use client";
import { useState, type ReactNode } from "react";
import { Play, RotateCw } from "lucide-react";
// Registers the entrance-motion engine once for every playground on the site —
// the exact import a consumer adds to enable the `animate` prop.
import "@microcharts/react/motion";
import { cn } from "@/lib/cn";
import { getModule } from "@/lib/charts/registry";
import { CodeWithData } from "@/components/ui/code-with-data";
import type { Knob, KnobValue, SampleData } from "@/lib/charts/types";

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

/* ── shell ──────────────────────────────────────────────────────────────── */

function Shell({
  onShuffle,
  onReplay,
  mode,
  onMode,
  preview,
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
      <div className="grid-paper flex min-h-32 items-center justify-center px-6 py-10">
        <div key={morphKey} className="mc-morph flex w-full items-center justify-center">
          {preview}
        </div>
      </div>
      {mode && onMode && (
        /* Always rendered at a fixed height so switching modes never shifts
           the layout; the static line doubles as interactive discoverability. */
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
        /* The entry choice IS the product's grammar — give it a real surface,
           not a header afterthought: two captioned options, full width. */
        <div
          role="radiogroup"
          aria-label="Chart entry"
          className="grid grid-cols-2 border-t border-hairline"
        >
          {(
            [
              ["static", "Static", "pure SVG · zero client JS"],
              ["interactive", "Interactive", "hover · keyboard · live values"],
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
 */
export function Playground({ chart }: { chart: string }) {
  const mod = getModule(chart);
  const spec = mod?.playground;
  const entry = mod?.entry;
  const [state, setState] = useState<Record<string, KnobValue>>(() =>
    Object.fromEntries((spec?.knobs ?? []).map((k) => [k.key, k.init])),
  );
  const [data, setData] = useState<number[]>(spec?.data ?? []);
  const [seed, setSeed] = useState(1);
  const [mode, setMode] = useState<"static" | "interactive">("static");
  const [animate, setAnimate] = useState(false);
  const [take, setTake] = useState(0);
  if (!spec || !entry) return null;

  const interactive = mode === "interactive" && !!spec.renderInteractive;
  const canAnimate = interactive && spec.animates !== false;
  const ui = { animate: canAnimate && animate };

  // remount (and morph) on discrete-knob, data, or mode changes — never on
  // slider drags. Remounting is also exactly what replays the entrance.
  const morphKey = spec.knobs
    .filter((k) => k.kind !== "range")
    .map((k) => String(state[k.key]))
    .concat(spec.shuffle ? [String(seed)] : [])
    .concat([mode, String(animate), String(take)])
    .join("-");

  // Copy-complete: the snippet always carries its own imports and reflects
  // the exact playground state (docs-as-tests).
  const importPath = interactive
    ? (entry.interactiveImport ?? entry.staticImport)
    : entry.staticImport;
  const jsx = interactive
    ? (spec.codeInteractive?.(state, data, ui) ?? spec.code(state, data))
    : spec.code(state, data);
  const code = [
    `import { ${entry.name} } from "${importPath}";`,
    ...(ui.animate ? ['import "@microcharts/react/motion";'] : []),
    "",
    jsx,
  ].join("\n");

  return (
    <Shell
      morphKey={morphKey}
      mode={spec.renderInteractive ? mode : undefined}
      onMode={spec.renderInteractive ? setMode : undefined}
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
      preview={interactive ? spec.renderInteractive!(state, data, ui) : spec.render(state, data)}
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
          {canAnimate && <Toggle label="animate" value={animate} onChange={setAnimate} />}
        </>
      }
      code={code}
    />
  );
}
