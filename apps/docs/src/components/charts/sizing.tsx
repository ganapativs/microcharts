import type { ReactNode } from "react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import { ActivityGrid } from "@microcharts/react/activity-grid";
import { LiveDemo } from "@/components/ui/live-demo";
import { getChart } from "@/lib/catalog";

/**
 * Per-chart "Sizing" section — the code-first answer to "how big is it and how
 * do I control that?". Every recipe pairs the real rendered chart with the
 * exact JSX that produced it, so the size prop the reader copies is the size
 * they see (docs-as-tests discipline, same contract as <LiveDemo>).
 *
 * Two size models across the catalog:
 *  - SVG charts (Sparkline/SparkBar/Bullet): `width`/`height` are viewBox units
 *    that also set the rendered pixel box; omit them + drive CSS width for a
 *    fluid chart (the viewBox keeps the aspect ratio).
 *  - ActivityGrid sizes from `cell`; Delta is text and scales with font-size.
 */

interface Recipe {
  label: string;
  code: string;
  node: ReactNode;
}

/** A visibly-constrained box so the "fills its container" recipe reads as fluid. */
function FluidFrame({ children }: { children: ReactNode }) {
  return (
    <div className="w-full">
      <div
        className="mx-auto rounded-md border border-dashed border-fd-border p-3"
        style={{ width: "100%", maxWidth: 320 }}
      >
        {children}
      </div>
    </div>
  );
}

function recipesFor(slug: string): Recipe[] {
  switch (slug) {
    case "sparkline":
      return [
        {
          label: "default",
          code: `// data alone → an intrinsic 80×20 box\n<Sparkline data={[3, 5, 4, 8, 6, 9]} />`,
          node: <Sparkline data={[3, 5, 4, 8, 6, 9]} summary={false} />,
        },
        {
          label: "fixed size",
          code: `// width & height are viewBox units — they also set the pixel box\n<Sparkline data={[3, 5, 4, 8, 6, 9]} width={200} height={48} />`,
          node: <Sparkline data={[3, 5, 4, 8, 6, 9]} width={200} height={48} summary={false} />,
        },
        {
          label: "responsive",
          code: `// omit width/height, let CSS drive the width — the viewBox keeps the ratio\n<div style={{ width: "100%", maxWidth: 320 }}>\n  <Sparkline data={[3, 5, 4, 8, 6, 9]} style={{ width: "100%", height: "auto" }} />\n</div>`,
          node: (
            <FluidFrame>
              <Sparkline
                data={[3, 5, 4, 8, 6, 9]}
                style={{ width: "100%", height: "auto" }}
                summary={false}
              />
            </FluidFrame>
          ),
        },
      ];
    case "sparkbar":
      return [
        {
          label: "default",
          code: `// data alone → an intrinsic 80×20 box\n<SparkBar data={[4, 6, 2, 8, 5, 9]} />`,
          node: <SparkBar data={[4, 6, 2, 8, 5, 9]} summary={false} />,
        },
        {
          label: "fixed size",
          code: `// width & height are viewBox units — they also set the pixel box\n<SparkBar data={[4, 6, 2, 8, 5, 9]} width={200} height={48} />`,
          node: <SparkBar data={[4, 6, 2, 8, 5, 9]} width={200} height={48} summary={false} />,
        },
        {
          label: "responsive",
          code: `// omit width/height, let CSS drive the width — the viewBox keeps the ratio\n<div style={{ width: "100%", maxWidth: 320 }}>\n  <SparkBar data={[4, 6, 2, 8, 5, 9]} style={{ width: "100%", height: "auto" }} />\n</div>`,
          node: (
            <FluidFrame>
              <SparkBar
                data={[4, 6, 2, 8, 5, 9]}
                style={{ width: "100%", height: "auto" }}
                summary={false}
              />
            </FluidFrame>
          ),
        },
      ];
    case "bullet":
      return [
        {
          label: "default",
          code: `// data alone → an intrinsic 80×16 box\n<Bullet value={72} target={80} bands={[50, 90]} />`,
          node: <Bullet value={72} target={80} bands={[50, 90]} summary={false} />,
        },
        {
          label: "fixed size",
          code: `// a bullet reads best wide and short\n<Bullet value={72} target={80} bands={[50, 90]} width={240} height={24} />`,
          node: (
            <Bullet
              value={72}
              target={80}
              bands={[50, 90]}
              width={240}
              height={24}
              summary={false}
            />
          ),
        },
        {
          label: "responsive",
          code: `// fills a table cell or card column, aspect ratio preserved\n<div style={{ width: "100%", maxWidth: 320 }}>\n  <Bullet value={72} target={80} bands={[50, 90]} style={{ width: "100%", height: "auto" }} />\n</div>`,
          node: (
            <FluidFrame>
              <Bullet
                value={72}
                target={80}
                bands={[50, 90]}
                style={{ width: "100%", height: "auto" }}
                summary={false}
              />
            </FluidFrame>
          ),
        },
      ];
    case "activity-grid":
      return [
        {
          label: "default cells",
          code: `// ActivityGrid sizes from cell edge length (default 10)\n<ActivityGrid data={data} />`,
          node: (
            <ActivityGrid
              data={[0, 1, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 2, 1]}
              summary={false}
            />
          ),
        },
        {
          label: "larger cells",
          code: `// bump every cell — the whole grid scales with it\n<ActivityGrid data={data} cell={14} />`,
          node: (
            <ActivityGrid
              data={[0, 1, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 3, 1, 0, 2, 4, 3, 2, 1]}
              cell={14}
              summary={false}
            />
          ),
        },
        {
          label: "responsive",
          code: `// let CSS drive the width — the viewBox keeps the grid's ratio\n<div style={{ width: "100%", maxWidth: 320 }}>\n  <ActivityGrid data={data} style={{ width: "100%", height: "auto" }} />\n</div>`,
          node: (
            <FluidFrame>
              {/* a full quarter (13 weeks) so the fluid grid reads landscape at
                  the frame width — 20 values gave ~3 giant columns. Deterministic
                  wave, not random (SSR-stable). */}
              <ActivityGrid
                data={Array.from({ length: 91 }, (_, i) => (i * 5 + (i % 3) * 7) % 5)}
                style={{ width: "100%", height: "auto" }}
                summary={false}
              />
            </FluidFrame>
          ),
        },
      ];
    case "delta":
      return [
        {
          label: "inherits text size",
          code: `// Delta is text — it takes the font-size of whatever wraps it\n<span style={{ fontSize: "1rem" }}>\n  Revenue <Delta value={0.124} />\n</span>`,
          node: (
            <span style={{ fontSize: "1rem" }}>
              Revenue <Delta value={0.124} summary={false} />
            </span>
          ),
        },
        {
          label: "larger",
          code: `// scale it up beside a KPI figure by lifting the font-size\n<span style={{ fontSize: "1.75rem" }}>\n  <Delta value={0.124} />\n</span>`,
          node: (
            <span style={{ fontSize: "1.75rem" }}>
              <Delta value={0.124} summary={false} />
            </span>
          ),
        },
      ];
    default:
      return [];
  }
}

export function Sizing({ chart }: { chart: string }) {
  const c = getChart(chart);
  if (!c) return null;
  const recipes = recipesFor(chart);
  if (recipes.length === 0) return null;

  return (
    <>
      {recipes.map((r) => (
        <LiveDemo key={r.label} label={r.label} code={r.code}>
          {r.node}
        </LiveDemo>
      ))}
    </>
  );
}
