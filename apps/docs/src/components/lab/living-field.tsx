"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { RugStrip } from "@microcharts/react/rug-strip";
import { Waveform } from "@microcharts/react/waveform";
import { Seismogram } from "@microcharts/react/seismogram";
import { HistogramStrip } from "@microcharts/react/histogram-strip";

/**
 * Direction B backdrop — the catalog as a quiet data field. Three depth layers
 * of faint REAL static charts (never mock SVGs), each layer drifting on a slow
 * CSS loop and parallaxing a few px against the cursor. One pointermove
 * listener; transforms only; reduced motion = still field.
 */

/** Deterministic LCG so SSR and client render the identical field. */
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 2 ** 32);
}

function series(rand: () => number, n: number, lift: number): number[] {
  const out: number[] = [];
  let v = 5 + rand() * 4;
  for (let i = 0; i < n; i++) {
    v = Math.max(0.5, v + (rand() - 0.46) * 2.4 + lift);
    out.push(Math.round(v * 10) / 10);
  }
  return out;
}

const KINDS = ["spark", "bar", "rug", "wave", "seis", "hist"] as const;

function chartFor(kind: (typeof KINDS)[number], data: number[]): ReactNode {
  const p = { width: 84, height: 22, summary: false as const };
  switch (kind) {
    case "spark":
      return <Sparkline data={data} curve="smooth" {...p} />;
    case "bar":
      return <SparkBar data={data.slice(0, 10)} {...p} />;
    case "rug":
      return <RugStrip data={data} {...p} height={12} />;
    case "wave":
      return <Waveform data={data.map((d, i) => (i % 2 ? d : -d))} {...p} />;
    case "seis":
      return <Seismogram data={data} {...p} />;
    case "hist":
      return <HistogramStrip data={data} {...p} />;
  }
}

interface Cell {
  left: number;
  top: number;
  kind: (typeof KINDS)[number];
  data: number[];
}

function buildLayer(seed: number, count: number): Cell[] {
  const rand = lcg(seed);
  const cells: Cell[] = [];
  const cols = Math.ceil(Math.sqrt(count * 2));
  for (let i = 0; i < count; i++) {
    // jittered grid — even coverage, no clumps, no overlap at these sizes
    const col = i % cols;
    const row = Math.floor(i / cols);
    cells.push({
      left: Math.round((col / cols) * 100 + rand() * (72 / cols)),
      top: Math.round((row / Math.ceil(count / cols)) * 100 + rand() * 14),
      kind: KINDS[Math.floor(rand() * KINDS.length)],
      data: series(rand, 12, rand() * 0.3),
    });
  }
  return cells;
}

const LAYERS = [
  { seed: 11, count: 14, depth: 6, className: "lab-field-far" },
  { seed: 23, count: 12, depth: 12, className: "lab-field-mid" },
  { seed: 47, count: 8, depth: 20, className: "lab-field-near" },
];

const LAYER_CELLS = LAYERS.map((l) => buildLayer(l.seed, l.count));

export function LivingField() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layers = Array.from(host.querySelectorAll<HTMLElement>("[data-depth]"));
    let raf = 0;
    let tx = 0;
    let ty = 0;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const apply = () => {
      raf = 0;
      for (const l of layers) {
        const d = Number(l.dataset.depth);
        l.style.transform = `translate3d(${(-tx * d).toFixed(1)}px, ${(-ty * d).toFixed(1)}px, 0)`;
      }
    };
    host.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      host.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={hostRef} aria-hidden className="lab-field pointer-events-none absolute inset-0 -z-10">
      {LAYERS.map((layer, li) => (
        <div key={layer.seed} data-depth={layer.depth} className="absolute inset-0">
          <div className={`absolute inset-[-4%] ${layer.className}`}>
            {LAYER_CELLS[li].map((cell, i) => (
              <span
                key={i}
                className="absolute"
                style={{ left: `${cell.left}%`, top: `${cell.top}%` }}
              >
                {chartFor(cell.kind, cell.data)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
