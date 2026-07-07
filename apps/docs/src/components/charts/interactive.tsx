"use client";
import { useState } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { Bullet } from "@microcharts/react/bullet/interactive";
import { ActivityGrid } from "@microcharts/react/activity-grid/interactive";
import { RotateCw } from "lucide-react";

const grid = [
  0, 1, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 2, 1, 3, 0, 2, 3, 4, 1, 2, 0, 1, 2, 3, 4, 2,
  1, 0,
];

const HINTS: Record<string, string> = {
  sparkline: "Hover the line, or focus it and walk points with ← →.",
  sparkbar: "Hover a bar, or focus and step through with ← →.",
  delta: "Shuffle the value — it re-announces politely to screen readers.",
  bullet: "Hover or focus to hear the value against its target.",
  "activity-grid": "Hover a cell, or focus and move in 2-D with the arrow keys.",
};

function Chart({ slug, deltaValue }: { slug: string; deltaValue: number }) {
  switch (slug) {
    case "sparkline":
      return (
        <Sparkline
          data={[12, 15, 13, 18, 16, 22, 19, 24, 21, 28, 25, 31, 29, 36]}
          width={360}
          height={96}
          curve="smooth"
          dots="minmax"
          className="w-full max-w-md"
          title="Monthly active developers"
        />
      );
    case "sparkbar":
      return (
        <SparkBar
          data={[5, 8, 3, 9, 6, 11, 4, 10, 7, 12, 8, 6]}
          width={340}
          height={92}
          label="last"
          className="w-full max-w-md"
          title="Deploys per day"
        />
      );
    case "delta":
      return (
        <span className="text-3xl">
          <Delta value={deltaValue} title="Growth vs last week" live />
        </span>
      );
    case "bullet":
      return (
        <Bullet
          value={72}
          target={80}
          bands={[50, 90]}
          width={320}
          height={30}
          className="w-full max-w-md"
          title="Quota attainment"
        />
      );
    case "activity-grid":
      return <ActivityGrid data={grid} cell={13} title="Commit activity" />;
    default:
      return null;
  }
}

/** A fully interactive example of a chart's `/interactive` entry. */
export function InteractiveDemo({ slug }: { slug: string }) {
  const [deltaValue, setDeltaValue] = useState(0.184);

  return (
    <div className="panel not-prose my-6 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-fd-border px-4 py-2.5">
        <span className="mono-label">Interactive</span>
        {slug === "delta" && (
          <button
            type="button"
            onClick={() => setDeltaValue((v) => (v > 0 ? -0.062 : 0.184))}
            aria-label="Change value"
            title="Change value"
            className="ghost-ctrl size-8"
          >
            <RotateCw className="size-4" />
          </button>
        )}
      </div>
      <div className="grid-paper flex min-h-40 items-center justify-center px-6 py-10">
        <Chart slug={slug} deltaValue={deltaValue} />
      </div>
      <div className="border-t border-fd-border px-4 py-2.5 text-sm text-fd-muted-foreground">
        {HINTS[slug]}
      </div>
    </div>
  );
}
