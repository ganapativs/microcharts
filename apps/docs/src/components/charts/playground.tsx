"use client";
import { useState, type ReactNode } from "react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { ActivityGrid } from "@microcharts/react/activity-grid";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/cn";

/* ── shared control primitives ─────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="mono-label text-[0.58rem]">{label}</span>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
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
      <div className="flex items-center justify-between gap-3 border-b border-fd-border px-4 py-2.5">
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
      <div className="flex flex-wrap items-start gap-x-6 gap-y-4 border-t border-fd-border px-4 py-4">
        {controls}
      </div>
      <div className="code-inset border-t border-fd-border">
        <DynamicCodeBlock lang="tsx" code={code} />
      </div>
    </div>
  );
}

function wave(seed: number) {
  return Array.from(
    { length: 12 },
    (_, i) => 6 + Math.round(Math.sin(i * 0.9 + seed) * 5 + i * 1.4 + ((i + seed) % 3) * 3),
  );
}

/* ── per-chart playgrounds ────────────────────────────────────────────────── */

function SparklinePG() {
  const [data, setData] = useState(wave(0));
  const [curve, setCurve] = useState<"linear" | "smooth" | "step">("smooth");
  const [dots, setDots] = useState<"auto" | "minmax" | "none">("minmax");
  const [fill, setFill] = useState(false);
  const [band, setBand] = useState(false);
  const [label, setLabel] = useState(true);
  const [seed, setSeed] = useState(1);
  const code = [
    "<Sparkline",
    `  data={[${data.join(", ")}]}`,
    `  curve="${curve}"`,
    `  dots="${dots}"`,
    fill && "  fill",
    band && "  band={[10, 26]}",
    label && '  label="last"',
    "/>",
  ]
    .filter(Boolean)
    .join("\n");
  return (
    <Shell
      morphKey={`${curve}-${dots}-${fill}-${band}-${label}-${seed}`}
      onShuffle={() => {
        setData(wave(seed));
        setSeed((s) => s + 1);
      }}
      preview={
        <Sparkline
          data={data}
          width={340}
          height={92}
          curve={curve}
          dots={dots}
          fill={fill}
          band={band ? [10, 26] : undefined}
          label={label ? "last" : "none"}
          className="w-full max-w-md"
          title="Playground"
        />
      }
      controls={
        <>
          <Segmented
            label="curve"
            value={curve}
            options={["linear", "smooth", "step"] as const}
            onChange={setCurve}
          />
          <Segmented
            label="dots"
            value={dots}
            options={["auto", "minmax", "none"] as const}
            onChange={setDots}
          />
          <Toggle label="fill" value={fill} onChange={setFill} />
          <Toggle label="band" value={band} onChange={setBand} />
          <Toggle label="label" value={label} onChange={setLabel} />
        </>
      }
      code={code}
    />
  );
}

function SparkBarPG() {
  const [data, setData] = useState([4, 6, 2, 8, 5, 9, 3, 7, 6, 10]);
  const [mode, setMode] = useState<"bar" | "winloss">("bar");
  const [label, setLabel] = useState(false);
  const [seed, setSeed] = useState(1);
  const shown = mode === "winloss" ? data.map((n) => (n % 2 === 0 ? 1 : -1)) : data;
  const code = [
    "<SparkBar",
    `  data={[${shown.join(", ")}]}`,
    `  mode="${mode}"`,
    label && '  label="last"',
    "/>",
  ]
    .filter(Boolean)
    .join("\n");
  return (
    <Shell
      morphKey={`${mode}-${label}-${seed}`}
      onShuffle={() => {
        setData(wave(seed));
        setSeed((s) => s + 1);
      }}
      preview={
        <SparkBar
          data={shown}
          width={340}
          height={92}
          mode={mode}
          label={label ? "last" : "none"}
          className="w-full max-w-md"
          title="Playground"
        />
      }
      controls={
        <>
          <Segmented
            label="mode"
            value={mode}
            options={["bar", "winloss"] as const}
            onChange={setMode}
          />
          <Toggle label="label" value={label} onChange={setLabel} />
        </>
      }
      code={code}
    />
  );
}

function BulletPG() {
  const [value, setValue] = useState(72);
  const [target, setTarget] = useState(80);
  const [bands, setBands] = useState(true);
  const code = [
    "<Bullet",
    `  value={${value}}`,
    `  target={${target}}`,
    bands && "  bands={[50, 90]}",
    "/>",
  ]
    .filter(Boolean)
    .join("\n");
  return (
    <Shell
      morphKey={`bands-${bands}`}
      preview={
        <Bullet
          value={value}
          target={target}
          bands={bands ? [50, 90] : undefined}
          width={300}
          height={28}
          className="w-full max-w-md"
          title="Playground"
        />
      }
      controls={
        <>
          <Range label="value" value={value} min={0} max={100} onChange={setValue} />
          <Range label="target" value={target} min={0} max={100} onChange={setTarget} />
          <Toggle label="bands" value={bands} onChange={setBands} />
        </>
      }
      code={code}
    />
  );
}

function ActivityGridPG() {
  const [data, setData] = useState(
    Array.from({ length: 35 }, (_, i) => Math.round(Math.abs(Math.sin(i * 1.3)) * 4)),
  );
  const [layout, setLayout] = useState<"grid" | "strip">("grid");
  const [cell, setCell] = useState<"9" | "12" | "15">("12");
  const [seed, setSeed] = useState(1);
  const code = [
    "<ActivityGrid",
    `  data={/* ${data.length} values */}`,
    `  layout="${layout}"`,
    `  cell={${cell}}`,
    "/>",
  ].join("\n");
  return (
    <Shell
      onShuffle={() => {
        setData(
          Array.from({ length: 35 }, (_, i) => Math.round(Math.abs(Math.sin(i * 1.3 + seed)) * 4)),
        );
        setSeed((s) => s + 1);
      }}
      morphKey={`${layout}-${cell}-${seed}`}
      preview={<ActivityGrid data={data} layout={layout} cell={Number(cell)} title="Playground" />}
      controls={
        <>
          <Segmented
            label="layout"
            value={layout}
            options={["grid", "strip"] as const}
            onChange={setLayout}
          />
          <Segmented
            label="cell"
            value={cell}
            options={["9", "12", "15"] as const}
            onChange={setCell}
          />
        </>
      }
      code={code}
    />
  );
}

function DeltaPG() {
  const [pct, setPct] = useState(12);
  const [positive, setPositive] = useState<"up" | "down">("up");
  const value = pct / 100;
  const code = ["<Delta", `  value={${value}}`, positive === "down" && '  positive="down"', "/>"]
    .filter(Boolean)
    .join("\n");
  return (
    <Shell
      morphKey={`delta-${positive}`}
      preview={
        <span className="text-3xl">
          <Delta value={value} positive={positive} summary={false} />
        </span>
      }
      controls={
        <>
          <Range label="change %" value={pct} min={-50} max={50} onChange={setPct} />
          <Segmented
            label="good dir"
            value={positive}
            options={["up", "down"] as const}
            onChange={setPositive}
          />
        </>
      }
      code={code}
    />
  );
}

const MAP: Record<string, () => ReactNode> = {
  sparkline: SparklinePG,
  sparkbar: SparkBarPG,
  bullet: BulletPG,
  "activity-grid": ActivityGridPG,
  delta: DeltaPG,
};

/** A live prop playground for any chart. `<Playground chart="bullet" />` */
export function Playground({ chart }: { chart: string }) {
  const Comp = MAP[chart];
  return Comp ? <Comp /> : null;
}
