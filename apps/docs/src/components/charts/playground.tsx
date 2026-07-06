"use client";
import { useState } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
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
    <div className="flex items-center justify-between gap-3">
      <span className="mono-label">{label}</span>
      <div className="flex rounded-md border border-fd-border bg-fd-muted/50 p-0.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={cn(
              "rounded px-2.5 py-1 font-mono text-xs transition-colors",
              value === o
                ? "bg-fd-card text-fd-foreground ring-1 ring-fd-border"
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
    <div className="flex items-center justify-between gap-3">
      <span className="mono-label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={cn(
          "relative h-6 w-10 rounded-full border transition-colors",
          value ? "border-fd-primary bg-fd-primary/20" : "border-fd-border bg-fd-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full transition-transform",
            value
              ? "translate-x-[1.15rem] bg-fd-primary"
              : "translate-x-0.5 bg-fd-muted-foreground",
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
    <div className="not-prose my-6 grid gap-4 rounded-xl border border-fd-border bg-fd-card p-4 sm:grid-cols-[1fr_auto]">
      <div className="flex flex-col">
        <div className="mono-label mb-3 flex items-center justify-between">
          <span>Live playground</span>
          <button
            type="button"
            onClick={shuffle}
            className="inline-flex items-center gap-1.5 rounded-md border border-fd-border px-2 py-1 normal-case tracking-normal text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          >
            <RotateCw className="size-3" /> shuffle
          </button>
        </div>
        <div className="grid-paper flex flex-1 items-center justify-center rounded-lg border border-fd-border/60 px-4 py-8">
          <Sparkline
            data={data}
            width={320}
            height={90}
            curve={curve}
            dots={dots}
            fill={fill}
            band={band ? [10, 26] : undefined}
            label={label ? "last" : "none"}
            className="w-full max-w-md"
            title="Playground"
          />
        </div>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-fd-border bg-fd-muted/40 p-3 font-mono text-xs leading-relaxed text-fd-foreground">
          {code}
        </pre>
      </div>

      <div className="flex flex-col gap-3 sm:w-52">
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
    </div>
  );
}
