import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { ArrowUpRight, Download } from "lucide-react";
import { docsMeta } from "@/lib/metadata";
import { SITE } from "@/lib/site";
import { Reveal } from "@/components/ui/reveal";
import { CopyButton } from "@/components/ui/copy";
import { CommandLine } from "@/components/ui/command-line";
import { Brandmark } from "@/components/brandmark";
import { ColorSwatch } from "@/components/brand/color-swatch";
import { CELL_FILL, CELL_R, CELL_SIZE, CELLS, SQUIRCLE_PATH } from "@/lib/brand";

export const metadata: Metadata = docsMeta({
  title: "Brand",
  description:
    "The microcharts mark, logo variants, colors, and type — with clear-space rules, usage guidance, and downloadable SVG assets.",
  path: "/brand",
});

type Tile = "light" | "dark" | "auto";
const ASSETS: { file: string; name: string; note: string; tile: Tile }[] = [
  { file: "mark.svg", name: "Primary", note: "Cobalt squircle", tile: "light" },
  { file: "mark-adaptive.svg", name: "Adaptive", note: "Auto light / dark", tile: "auto" },
  { file: "mark-mono-dark.svg", name: "Mono", note: "Dark ink · on light", tile: "light" },
  { file: "mark-mono-light.svg", name: "Mono", note: "Light ink · on dark", tile: "dark" },
  { file: "mark-ember.svg", name: "Ember", note: "Warm accent", tile: "light" },
  { file: "mark-teal.svg", name: "Teal", note: "Cool accent", tile: "light" },
];

function readAsset(file: string): { src: string; bytes: number } {
  const p = path.join(process.cwd(), "public", "brand", file);
  const src = fs.readFileSync(p, "utf8");
  return { src, bytes: Buffer.byteLength(src, "utf8") };
}

const ACCENTS: { name: string; light: string; dark: string }[] = [
  { name: "Cobalt", light: "#2f52d4", dark: "#7f9cf5" },
  { name: "Ember", light: "#c2410c", dark: "#f7924e" },
  { name: "Clay", light: "#a14a34", dark: "#e08e73" },
  { name: "Moss", light: "#4d7c1e", dark: "#a3c46a" },
  { name: "Teal", light: "#0f766e", dark: "#55c2b3" },
  { name: "Rose", light: "#be123c", dark: "#fb6f89" },
];

const SPECS: [string, string][] = [
  ["Container", "Superellipse · n 4.5"],
  ["Cells", "Three · graded fill"],
  ["Grid", "32 × 32 units"],
  ["Encoding", "Weight = value"],
];

function SectionMark({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="mono-label text-fd-primary">{n}</span>
      <span className="h-px flex-1 bg-hairline" />
      <span className="mono-label">{children}</span>
    </div>
  );
}

function markInner(fill: string, cellFill = CELL_FILL, cellOpacity = true) {
  return (
    <>
      <path d={SQUIRCLE_PATH} fill={fill} />
      {CELLS.map((c) => (
        <rect
          key={c.x}
          x={c.x}
          y={c.y}
          width={CELL_SIZE}
          height={CELL_SIZE}
          rx={CELL_R}
          fill={cellFill}
          opacity={cellOpacity ? c.o : 1}
        />
      ))}
    </>
  );
}

export default function BrandPage() {
  return (
    <>
      {/* ── Hero — no Reveal (gallery masthead pattern). Above-fold copy must
          paint immediately; pending opacity:0 left the CTAs blank over the field. */}
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 grid-paper opacity-60"
        />
        <div className="relative z-0 mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-16 sm:px-6 sm:pb-16 sm:pt-18 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
          <div>
            <span className="mono-label text-fd-primary">Brand kit</span>
            <h1 className="display mt-3 text-balance text-[length:var(--text-fluid-h2)] text-fd-foreground">
              The mark, and how to use it.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-fd-muted-foreground">
              Logo variants, colors, and type — the same small instrument that sits in the nav.
              Three data cells climb a diagonal, graded faint to solid.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="/brand/microcharts-brand-kit.zip"
                download
                className="cta-accent group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
              >
                <Download className="size-4" />
                Download kit
                <span className="font-mono text-xs opacity-70">.zip</span>
              </a>
              <a
                href={SITE.repo}
                target="_blank"
                rel="noreferrer noopener"
                className="cta-ghost inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-fd-foreground"
              >
                Source
                <ArrowUpRight className="size-4 opacity-60" />
              </a>
            </div>
          </div>

          <div className="panel relative flex min-h-[16rem] items-center justify-center overflow-hidden px-6 py-14 sm:min-h-[18rem]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid-paper opacity-50"
            />
            <Brandmark size={148} className="relative drop-shadow-sm" />
          </div>
        </div>
      </section>

      {/* ── 01 · The mark ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionMark n="01">The mark</SectionMark>
        <Reveal className="mb-8 max-w-2xl">
          <h2 className="display text-[length:var(--text-fluid-h2)]">ActivityGrid DNA, owned.</h2>
          <p className="mt-4 max-w-xl text-fd-muted-foreground">
            The three cells climb bottom-left to top-right, fill grading faint to solid. That grade
            is the same honest encoding the charts use — value carried by weight, not decoration.
          </p>
        </Reveal>
        <Reveal delay={60}>
          <dl className="panel grid grid-cols-2 sm:grid-cols-4">
            {SPECS.map(([k, v], i) => (
              <div
                key={k}
                className={
                  "flex flex-col gap-1.5 px-5 py-4" +
                  (i % 2 === 1 ? " border-l border-hairline" : "") +
                  (i >= 2 ? " border-t border-hairline sm:border-t-0" : "") +
                  (i > 0 ? " sm:border-l sm:border-hairline" : "")
                }
              >
                <dt className="mono-label leading-5">{k}</dt>
                <dd className="text-sm leading-5 text-fd-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* ── 02 · Logo variants ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionMark n="02">Logo variants</SectionMark>
        <Reveal className="mb-8 max-w-2xl">
          <h2 className="display text-[length:var(--text-fluid-h2)]">
            Six SVGs. Copy or download.
          </h2>
          <p className="mt-4 max-w-xl text-fd-muted-foreground">
            Primary Cobalt, adaptive for light/dark hosts, mono inks, and two accent siblings. Each
            file is the shipped asset under{" "}
            <span className="font-mono text-fd-foreground">/brand</span>.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ASSETS.map((a, i) => {
            const { src, bytes } = readAsset(a.file);
            return (
              <Reveal key={a.file} delay={i * 40} className="glass flex flex-col overflow-hidden">
                <div className="bk-stage" data-tile={a.tile}>
                  <img
                    src={`/brand/${a.file}`}
                    alt={`microcharts mark — ${a.name}`}
                    width={72}
                    height={72}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-hairline px-3.5 py-2.5">
                  <div className="min-w-0 leading-5">
                    <div className="truncate text-sm font-medium leading-5 text-fd-foreground">
                      {a.name}
                    </div>
                    <div className="mono-label truncate leading-5 opacity-70">{a.note}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <CopyButton text={src} size={8} />
                    <a
                      href={`/brand/${a.file}`}
                      download
                      aria-label={`Download ${a.file}`}
                      className="ghost-ctrl size-8"
                    >
                      <Download className="size-4" />
                    </a>
                  </div>
                </div>
                <div className="mono-label flex items-center justify-between border-t border-hairline/70 px-3.5 py-2 leading-5 opacity-60">
                  <span className="truncate">{a.file}</span>
                  <span className="shrink-0 tabular-nums">
                    {(bytes / 1024).toFixed(1)} kB · svg
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── 03 · Clear space & size ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionMark n="03">Clear space &amp; size</SectionMark>
        <Reveal className="mb-8 max-w-2xl">
          <h2 className="display text-[length:var(--text-fluid-h2)]">
            One cell of air. Sixteen pixels floor.
          </h2>
          <p className="mt-4 max-w-xl text-fd-muted-foreground">
            Keep clear space of at least one cell-width on every side. Below 16 px the grade
            collapses — never go smaller.
          </p>
        </Reveal>
        <div className="grid gap-3 lg:grid-cols-2">
          <Reveal className="panel flex flex-col items-center justify-center gap-5 p-8">
            <svg
              viewBox="0 0 56 56"
              width="188"
              height="188"
              role="img"
              aria-label="Clear space: one cell-width on every side"
            >
              <rect
                x="4"
                y="4"
                width="48"
                height="48"
                rx="4"
                fill="none"
                stroke="var(--accent)"
                strokeOpacity="0.4"
                strokeDasharray="2 2.5"
              />
              <g transform="translate(12 12)">{markInner("var(--accent)")}</g>
            </svg>
            <p className="mono-label text-center opacity-70">dashed field = reserved space</p>
          </Reveal>
          <Reveal delay={80} className="panel flex flex-col justify-center gap-8 p-8">
            <div className="grid grid-cols-3 gap-4">
              {[
                { px: 16, label: "16 px", role: "Favicon · minimum" },
                { px: 24, label: "24 px", role: "Inline · UI" },
                { px: 40, label: "40 px", role: "Comfortable" },
              ].map((s) => (
                <div key={s.px} className="flex flex-col items-center gap-3">
                  <div className="flex h-10 items-end justify-center">
                    <Brandmark size={s.px} />
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-xs leading-5 tabular-nums text-fd-foreground">
                      {s.label}
                    </div>
                    <div className="mono-label leading-5 opacity-70">{s.role}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="border-t border-hairline pt-5 text-sm leading-relaxed text-fd-muted-foreground">
              The SVG scales cleanly above 16 px to any size. Prefer the adaptive mark when the host
              theme can flip.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 04 · Misuse ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionMark n="04">Don’t</SectionMark>
        <Reveal className="mb-8 max-w-2xl">
          <h2 className="display text-[length:var(--text-fluid-h2)]">Protect the read.</h2>
          <p className="mt-4 max-w-xl text-fd-muted-foreground">
            Recolor cells, invert fills, rotate, stretch, add effects, or reflow the grid — each
            breaks the encoding the mark shares with the charts.
          </p>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            {
              label: "Recolor the cells",
              svg: (
                <>
                  <path d={SQUIRCLE_PATH} fill="var(--accent)" />
                  {CELLS.map((c) => (
                    <rect
                      key={c.x}
                      x={c.x}
                      y={c.y}
                      width={CELL_SIZE}
                      height={CELL_SIZE}
                      rx={CELL_R}
                      fill="#e11d48"
                      opacity={c.o}
                    />
                  ))}
                </>
              ),
            },
            {
              label: "Invert fills",
              svg: markInner("var(--color-fd-foreground)", "var(--color-fd-foreground)"),
            },
            {
              label: "Rotate",
              svg: <g transform="rotate(18 16 16)">{markInner("var(--accent)")}</g>,
            },
            {
              label: "Stretch",
              svg: <g transform="translate(0 5) scale(1 0.68)">{markInner("var(--accent)")}</g>,
            },
            {
              label: "Add effects",
              svg: (
                <>
                  <defs>
                    <filter id="dropbad" x="-40%" y="-40%" width="180%" height="180%">
                      <feDropShadow dx="0" dy="1.6" stdDeviation="1.4" floodOpacity="0.5" />
                    </filter>
                  </defs>
                  <g filter="url(#dropbad)">{markInner("var(--accent)")}</g>
                </>
              ),
            },
            {
              label: "Reflow the grid",
              svg: (
                <>
                  <path d={SQUIRCLE_PATH} fill="var(--accent)" />
                  {[
                    { x: 8, y: 8, o: 0.4 },
                    { x: 20, y: 12, o: 0.7 },
                    { x: 12, y: 20, o: 1 },
                  ].map((c) => (
                    <rect
                      key={c.x}
                      x={c.x}
                      y={c.y}
                      width={CELL_SIZE}
                      height={CELL_SIZE}
                      rx={CELL_R}
                      fill={CELL_FILL}
                      opacity={c.o}
                    />
                  ))}
                </>
              ),
            },
          ].map((d, i) => (
            <Reveal key={d.label} delay={i * 35} className="glass flex flex-col overflow-hidden">
              <div className="bk-stage relative min-h-[6.5rem]" data-tile="light">
                <svg viewBox="0 0 32 32" width="56" height="56" aria-hidden>
                  {d.svg}
                </svg>
                <span aria-hidden className="bk-badge absolute right-2 top-2">
                  ×
                </span>
              </div>
              <div className="border-t border-hairline px-3 py-2.5 text-center">
                <span className="text-xs text-fd-muted-foreground">{d.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 05 · Color ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionMark n="05">Color</SectionMark>
        <Reveal className="mb-8 max-w-2xl">
          <h2 className="display text-[length:var(--text-fluid-h2)]">One accent. Six tunings.</h2>
          <p className="mt-4 max-w-xl text-fd-muted-foreground">
            A single token drives chrome, links, and chart emphasis. Cobalt is the default; five
            siblings swap through the picker. Click any chip to copy its hex.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACCENTS.map((a) => (
            <div key={a.name} className="grid grid-cols-2 gap-2">
              <ColorSwatch hex={a.light} name={a.name} role="Light" />
              <ColorSwatch hex={a.dark} name={a.name} role="Dark" />
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="mono-label mb-3">Neutrals</div>
            <div className="grid grid-cols-2 gap-2">
              <ColorSwatch hex="#e9edf4" name="Paper" role="Light" ring />
              <ColorSwatch hex="#12151d" name="Ink" role="Light" />
              <ColorSwatch hex="#0a0b0f" name="Paper" role="Dark" />
              <ColorSwatch hex="#e9e8e3" name="Ink" role="Dark" ring />
              <ColorSwatch hex="#faf7f1" name="Cell fill" role="Mark" ring />
            </div>
          </Reveal>
          <Reveal delay={60}>
            <div className="mono-label mb-3">Semantic — never color alone</div>
            <div className="grid grid-cols-2 gap-2">
              <ColorSwatch hex="#077353" name="Positive" role="Light" />
              <ColorSwatch hex="#34d399" name="Positive" role="Dark" />
              <ColorSwatch hex="#ad4713" name="Negative" role="Light" />
              <ColorSwatch hex="#fb8c5a" name="Negative" role="Dark" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 06 · Type ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionMark n="06">Type</SectionMark>
        <Reveal className="mb-8 max-w-2xl">
          <h2 className="display text-[length:var(--text-fluid-h2)]">Three voices. One system.</h2>
          <p className="mt-4 max-w-xl text-fd-muted-foreground">
            Display for titles, grotesk for reading, mono for measurement. Same trio as the rest of
            the site.
          </p>
        </Reveal>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              cls: "display text-5xl",
              specimen: "Ag",
              name: "Bricolage Grotesque",
              role: "Display",
              use: "Titles, hero, section headings.",
            },
            {
              cls: "text-5xl font-semibold tracking-tight",
              specimen: "Ag",
              name: "Hanken Grotesk",
              role: "UI · Body",
              use: "Prose, controls, everything read at length.",
            },
            {
              cls: "font-mono text-5xl",
              specimen: "Ag",
              name: "JetBrains Mono",
              role: "Metadata · Code",
              use: "Labels, sizes, coordinates, snippets.",
            },
          ].map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 50}
              className="glass flex h-full flex-col gap-4 px-5 py-6"
            >
              <div className={t.cls + " text-fd-foreground"}>{t.specimen}</div>
              <div className="mt-auto border-t border-hairline pt-4 leading-5">
                <div className="text-sm font-medium leading-5 text-fd-foreground">{t.name}</div>
                <div className="mono-label leading-5">{t.role}</div>
                <p className="mt-2 text-sm leading-5 text-fd-muted-foreground">{t.use}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 07 · The name ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <SectionMark n="07">The name</SectionMark>
        <Reveal className="mb-8 max-w-2xl">
          <h2 className="display text-[length:var(--text-fluid-h2)]">One lowercase word.</h2>
          <p className="mt-4 max-w-xl text-fd-muted-foreground">
            Always “microcharts” — even at the start of a sentence. Never MicroCharts, micro charts,
            or µcharts.
          </p>
        </Reveal>
        <div className="grid items-stretch gap-3 lg:grid-cols-2">
          <Reveal className="panel flex h-full flex-col gap-5 p-7">
            <div className="flex items-center gap-3">
              <Brandmark size={30} />
              <span className="text-2xl font-semibold leading-none tracking-[-0.01em] text-fd-foreground">
                microcharts
              </span>
            </div>
            <ul className="space-y-2.5 text-sm text-fd-muted-foreground">
              <li>The mark may pair with the wordmark or stand alone.</li>
              <li>Don’t redraw the wordmark — use the shipped lockup.</li>
            </ul>
          </Reveal>
          <Reveal delay={80} className="panel flex h-full flex-col overflow-hidden p-0">
            <dl className="grid h-full min-h-[8.25rem] grid-rows-3 divide-y divide-hairline">
              {[
                { k: "Name", v: "microcharts", cmd: false },
                { k: "Package", v: SITE.pkg, cmd: false },
                { k: "Install", v: `pnpm add ${SITE.pkg}`, cmd: true },
              ].map((row) => (
                <div
                  key={row.k}
                  className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-x-3 px-4"
                >
                  <dt className="mono-label">{row.k}</dt>
                  <dd className="min-w-0">
                    {row.cmd ? (
                      <CommandLine
                        command={row.v}
                        prompt={false}
                        className="block truncate text-sm"
                      />
                    ) : (
                      <code className="block truncate font-mono text-sm text-fd-foreground">
                        {row.v}
                      </code>
                    )}
                  </dd>
                  <CopyButton text={row.v} size={7} className="shrink-0" />
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ── Permission ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="panel relative flex flex-col gap-4 overflow-hidden px-6 py-12 sm:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 grid-paper opacity-40"
          />
          <h2 className="display relative max-w-2xl text-[length:var(--text-fluid-h2)] text-fd-foreground">
            Use it to point at the work.
          </h2>
          <p className="relative max-w-2xl text-sm leading-relaxed text-fd-muted-foreground">
            Link to or reference microcharts — a “built with,” a talk slide, an integration. Don’t
            modify the mark, use it as your own product’s mark, or imply endorsement. The code is{" "}
            <a
              href={SITE.repo}
              target="_blank"
              rel="noreferrer noopener"
              className="link-underline text-fd-foreground"
            >
              MIT
            </a>
            . Questions?{" "}
            <a
              href={SITE.authorX}
              target="_blank"
              rel="noreferrer noopener"
              className="link-underline text-fd-foreground"
            >
              {SITE.authorXHandle}
            </a>
            .
          </p>
          <div className="relative mt-2">
            <a
              href="/brand/microcharts-brand-kit.zip"
              download
              className="cta-accent inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
            >
              <Download className="size-4" />
              Download kit
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
