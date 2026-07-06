"use client";
import { useState } from "react";
import { Sparkline } from "@microcharts/react/sparkline";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/cn";

type Curve = "linear" | "smooth" | "step";
type Dots = "auto" | "minmax" | "none";

const SEED = [8, 11, 9, 14, 12, 18, 15, 21, 19, 26, 24, 30];

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
    <div className="flex flex-col gap-1.5">
      <span className="mono-label text-[0.58rem]">{label}</span>
      <div className="flex w-max rounded-md border border-fd-border bg-fd-muted/50 p-0.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "rounded px-2 py-1 font-mono text-[0.7rem] leading-none transition-colors",
              value === o
                ? "bg-fd-card text-fd-foreground shadow-sm ring-1 ring-fd-border"
                : "text-fd-muted-foreground hover:text-fd-foreground",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
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
    <div className="flex flex-col gap-1.5">
      <span className="mono-label text-[0.58rem]">{label}</span>
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
    </div>
  );
}

/** An interactive workshop: tweak props and watch the chart respond live. */
export function Playground() {
  const [data, setData] = useState<number[]>(SEED);
  const [curve, setCurve] = useState<Curve>("smooth");
  const [dots, setDots] = useState<Dots>("minmax");
  const [fill, setFill] = useState(false);
  const [band, setBand] = useState(false);
  const [label, setLabel] = useState(true);

  function shuffle() {
    setData(
      Array.from(
        { length: 12 },
        (_, i) => 6 + Math.round(Math.sin(i * 0.9) * 5 + i * 1.6 + (i % 3) * 3),
      ),
    );
  }

  const code = [
    `<Sparkline`,
    `  data={[${data.join(", ")}]}`,
    `  curve="${curve}"`,
    `  dots="${dots}"`,
    fill ? `  fill` : null,
    band ? `  band={[10, 26]}` : null,
    label ? `  label="last"` : null,
    `  title="Playground"`,
    `/>`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-fd-border bg-fd-card">
      <div className="flex items-center justify-between gap-3 border-b border-fd-border px-4 py-2.5">
        <span className="mono-label">Live playground</span>
        <button
          type="button"
          onClick={shuffle}
          className="inline-flex items-center gap-1.5 rounded-md border border-fd-border px-2 py-1 font-mono text-[0.68rem] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
        >
          <RotateCw className="size-3" /> shuffle
        </button>
      </div>

      <div className="grid-paper flex items-center justify-center px-6 py-10">
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
      </div>

      <div className="flex flex-wrap items-start gap-x-6 gap-y-4 border-t border-fd-border px-4 py-4">
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
      </div>

      <div className="border-t border-fd-border [&_figure]:!my-0 [&_figure]:!rounded-none [&_figure]:!border-0">
        <DynamicCodeBlock lang="tsx" code={code} />
      </div>
    </div>
  );
}
