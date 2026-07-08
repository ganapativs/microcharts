"use client";
import { useState, type ReactNode } from "react";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { getModule } from "@/lib/charts/registry";
import type { Knob, KnobValue } from "@/lib/charts/types";

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
  preview,
  controls,
  code,
  morphKey,
}: {
  onShuffle?: () => void;
  preview: ReactNode;
  controls: ReactNode;
  code: string;
  /** Replays a gentle morph when this changes — pass only discrete props, never
      slider values, so dragging doesn't strobe. */
  morphKey?: string;
}) {
  return (
    <div className="panel not-prose my-6 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
        <span className="mono-label">Live playground</span>
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
      <div className="grid-paper flex min-h-32 items-center justify-center px-6 py-10">
        <div key={morphKey} className="mc-morph flex w-full items-center justify-center">
          {preview}
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4 border-t border-hairline px-4 py-4">
        {controls}
      </div>
      <div className="code-inset border-t border-hairline">
        <DynamicCodeBlock lang="tsx" code={code} />
      </div>
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

/** A live prop playground for any chart. `<Playground chart="bullet" />` */
export function Playground({ chart }: { chart: string }) {
  const spec = getModule(chart)?.playground;
  const [state, setState] = useState<Record<string, KnobValue>>(() =>
    Object.fromEntries((spec?.knobs ?? []).map((k) => [k.key, k.init])),
  );
  const [data, setData] = useState<number[]>(spec?.data ?? []);
  const [seed, setSeed] = useState(1);
  if (!spec) return null;

  // remount (and morph) on discrete-knob or data changes — never on slider drags
  const morphKey = spec.knobs
    .filter((k) => k.kind !== "range")
    .map((k) => String(state[k.key]))
    .concat(spec.shuffle ? [String(seed)] : [])
    .join("-");

  return (
    <Shell
      morphKey={morphKey}
      onShuffle={
        spec.shuffle
          ? () => {
              setData(spec.shuffle!(seed));
              setSeed((s) => s + 1);
            }
          : undefined
      }
      preview={spec.render(state, data)}
      controls={spec.knobs.map((k) => (
        <KnobControl
          key={k.key}
          knob={k}
          value={state[k.key]!}
          onChange={(v) => setState((s) => ({ ...s, [k.key]: v }))}
        />
      ))}
      code={spec.code(state, data)}
    />
  );
}
