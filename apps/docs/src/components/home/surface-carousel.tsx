"use client";
// oxlint-disable react/no-array-index-key -- SURFACES is a static module constant; indexes are stable identity
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LayoutDashboard, FileText, FileCode2 } from "lucide-react";
import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";

/**
 * "Where they live" — one panel that auto-rotates through the surfaces a
 * word-sized chart lives in once a model or a person has written it: a product
 * UI, a rendered report, and the docs themselves. Real charts, not a video.
 * Hover/focus pauses; reduced motion holds one surface and switches instantly.
 */

const ADVANCE_MS = 4600;

/* ── Surface 1 · the product ─────────────────────────────────────────────── */
const MRR = [31, 33, 32, 36, 35, 40, 42, 45, 44, 48];
const LAT = [48, 45, 44, 40, 38, 36, 33, 31];
const SERVICES = [
  { name: "checkout", data: [48, 45, 44, 40, 38, 36, 33, 31], now: "31 ms", d: -0.14 },
  { name: "search", data: [80, 78, 82, 79, 81, 80, 79, 78], now: "78 ms", d: 0.01 },
  { name: "auth", data: [12, 13, 12, 14, 13, 15, 14, 16], now: "16 ms", d: 0.08 },
];

function KpiCard({
  label,
  figure,
  d,
  children,
}: {
  label: string;
  figure: string;
  d: number;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-hairline p-3">
      <span className="mono-label opacity-70">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="display text-lg tabular-nums leading-none sm:text-xl">{figure}</span>
        <Delta value={d} summary={false} />
      </div>
      {children}
    </div>
  );
}

function ProductSurface() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-fd-foreground">Revenue overview</span>
        <span className="mono-label opacity-70">last 30 days</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <KpiCard label="MRR" figure="$48k" d={0.082}>
          <Sparkline data={MRR} summary={false} width={110} height={22} fill dots="none" />
        </KpiCard>
        <KpiCard label="p95" figure="31ms" d={-0.14}>
          <Sparkline data={LAT} summary={false} width={110} height={22} dots="none" />
        </KpiCard>
        <div className="col-span-2 flex flex-col gap-1.5 rounded-lg border border-hairline p-3 sm:col-span-1">
          <span className="mono-label opacity-70">error budget</span>
          <span className="display text-lg leading-none tabular-nums sm:text-xl">72%</span>
          <Bullet value={72} target={90} bands={[60, 95]} width={110} height={12} summary={false} />
        </div>
      </div>
      <table className="mc-inline-table w-full text-sm tabular-nums">
        <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-hairline">
          {SERVICES.map((s) => (
            <tr key={s.name}>
              <td className="py-1.5 pr-3 text-fd-muted-foreground">{s.name}</td>
              <td className="py-1.5">
                <Sparkline data={s.data} summary={false} width={72} height={16} dots="none" />
              </td>
              <td className="py-1.5 pl-3 text-right text-fd-muted-foreground">{s.now}</td>
              <td className="py-1.5 pl-3 text-right">
                <Delta value={s.d} summary={false} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Surface 2 · the report ──────────────────────────────────────────────── */
const BOOKINGS = [18, 22, 20, 27, 25, 31, 29, 34, 33, 38, 41, 46];

function ReportSurface() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <span className="mono-label opacity-70">Q3 review · finance</span>
      <h4 className="display text-lg leading-snug text-fd-foreground sm:text-xl">
        Revenue held its climb into Q3.
      </h4>
      <p className="text-[0.92rem] leading-relaxed text-fd-muted-foreground">
        Bookings closed the quarter up{" "}
        <span className="mc-inline">
          <Sparkline data={BOOKINGS} summary={false} width={56} height={15} dots="none" />
        </span>{" "}
        <Delta value={0.184} summary={false} /> against plan, with new-logo mix steady.
      </p>
      <figure className="rounded-lg border border-hairline p-3.5">
        <SparkBar data={BOOKINGS} summary={false} width={340} height={54} className="w-full" />
        <figcaption className="mono-label mt-2 opacity-70">
          monthly bookings, $000 · fig. 3
        </figcaption>
      </figure>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          ["Net new", "$1.2M", 0.21],
          ["Churn", "1.8%", -0.04],
          ["NRR", "114%", 0.03],
        ].map(([k, v, d]) => (
          <div key={k as string} className="flex flex-col gap-1">
            <span className="mono-label opacity-70">{k}</span>
            <span className="display text-base tabular-nums leading-none">{v}</span>
            <Delta value={d as number} summary={false} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Surface 3 · the docs (meta: this very page) ─────────────────────────── */
function DocsSurface() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3">
      <span className="mono-label opacity-70">docs · mdx</span>
      <p className="text-[0.92rem] leading-relaxed text-fd-muted-foreground">
        Drop a chart straight into Markdown — no image, no export step:
      </p>
      <pre className="overflow-x-auto rounded-lg border border-hairline bg-fd-muted/30 p-3.5 font-mono text-[0.78rem] leading-relaxed">
        <code>
          <span className="text-fd-muted-foreground">p95 latency is easing off </span>
          {"\n"}
          <span className="text-fd-primary">&lt;Sparkline</span> data=
          <span className="text-fd-foreground">{"{[46,43,47,39,41,34,36,31]}"}</span>{" "}
          <span className="text-fd-primary">/&gt;</span>
          {"\n"}
          <span className="text-fd-muted-foreground">across the release.</span>
        </code>
      </pre>
      <div className="flex items-center gap-2 rounded-lg border border-hairline p-3.5 text-[0.92rem] leading-relaxed text-fd-foreground">
        p95 latency is easing off{" "}
        <span className="mc-inline">
          <Sparkline
            data={[46, 43, 47, 39, 41, 34, 36, 31]}
            summary={false}
            width={72}
            height={18}
            curve="smooth"
            dots="minmax"
          />
        </span>{" "}
        across the release.
      </div>
      <p className="mono-label opacity-70">↑ these docs render exactly this, live</p>
    </div>
  );
}

type Surface = { id: string; label: string; Icon: typeof LayoutDashboard; Node: ReactNode };

const SURFACES: Surface[] = [
  { id: "product", label: "Product", Icon: LayoutDashboard, Node: <ProductSurface /> },
  { id: "report", label: "Report", Icon: FileText, Node: <ReportSurface /> },
  { id: "docs", label: "Docs", Icon: FileCode2, Node: <DocsSurface /> },
];

export function SurfaceCarousel() {
  const [active, setActive] = useState(0);
  const [motion, setMotion] = useState(false); // false until we confirm motion is allowed
  const paused = useRef(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setMotion(true);
    let timer = 0;
    const tick = () => {
      if (document.visibilityState === "visible" && !paused.current) {
        setActive((i) => (i + 1) % SURFACES.length);
      }
      timer = window.setTimeout(tick, ADVANCE_MS);
    };
    timer = window.setTimeout(tick, ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const hold = () => {
    paused.current = true;
  };
  const release = () => {
    paused.current = false;
  };

  return (
    <div
      ref={hostRef}
      className="panel overflow-hidden"
      onMouseEnter={hold}
      onMouseLeave={release}
      onFocusCapture={hold}
      onBlurCapture={release}
    >
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <span className="mono-label">one chart · every surface</span>
        <div role="tablist" aria-label="Surfaces" className="flex items-center gap-1">
          {SURFACES.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={on}
                aria-label={s.label}
                onClick={() => setActive(i)}
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.7rem] font-medium transition-colors ${
                  on
                    ? "bg-fd-primary/10 text-fd-primary"
                    : "text-fd-muted-foreground hover:text-fd-foreground"
                }`}
              >
                <s.Icon className="size-3.5" aria-hidden />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Surfaces share one grid cell, so the stage auto-sizes to the tallest
          one (no clipping, responsive-safe). The incoming surface plays a rich
          rise/de-blur/row-stagger enter; the outgoing one just fades under it. */}
      <div className="grid px-5 py-6">
        {SURFACES.map((s, i) => {
          const on = i === active;
          return (
            <div
              key={s.id}
              role="tabpanel"
              aria-label={s.label}
              aria-hidden={!on}
              className={`col-start-1 row-start-1 flex items-center justify-center ${
                motion ? "transition-opacity duration-[450ms] ease-out" : ""
              } ${on ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"}`}
            >
              {on && motion ? (
                // key changes on every activation so the enter keyframe re-fires
                <div key={active} className="hx-surface-in flex w-full justify-center">
                  {s.Node}
                </div>
              ) : (
                s.Node
              )}
            </div>
          );
        })}
      </div>

      {/* auto-advance progress hairline */}
      <div className="h-px w-full bg-hairline/50">
        <div
          className="h-px bg-fd-primary/60 transition-[width] duration-300"
          style={{ width: `${((active + 1) / SURFACES.length) * 100}%` }}
        />
      </div>
    </div>
  );
}
