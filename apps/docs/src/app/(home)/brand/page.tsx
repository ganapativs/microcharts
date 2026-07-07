import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { ArrowUpRight, Download } from "lucide-react";
import { docsMeta } from "@/lib/metadata";
import { SITE } from "@/lib/site";
import { Reveal } from "@/components/ui/reveal";
import { CopyButton } from "@/components/ui/copy";
import { Brandmark } from "@/components/brandmark";
import { ColorSwatch } from "@/components/brand/color-swatch";
import { CELL_FILL, CELL_R, CELL_SIZE, CELLS, SQUIRCLE_PATH } from "@/lib/brand";

export const metadata: Metadata = docsMeta({
  title: "Brand",
  description:
    "The microcharts mark, logo variants, colors, and type — with clear-space rules, usage guidance, and downloadable SVG assets.",
  path: "/brand",
});

/* ── Downloadable logo assets — the real files under public/brand. Sources are
   read at build so the copy-SVG button hands back the exact shipped file. ── */
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

function SectionMark({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="mono-label text-fd-primary">{n}</span>
      <span className="h-px flex-1 bg-fd-border" />
      <span className="mono-label">{children}</span>
    </div>
  );
}

/* A raw copy of the mark for diagrams (clear-space, misuse). Uses the canonical
   geometry so every example is pixel-true to the shipped file. */
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
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="max-w-2xl">
        <Reveal>
          <span className="mono-label text-fd-primary">Brand kit</span>
          <h1 className="display mt-3 text-[length:var(--text-fluid-h2)]">
            The mark, and how to use it.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-fd-muted-foreground">
            Everything you need to reference microcharts — logo variants, colors, and type. The mark
            is a small instrument: three data cells climbing a diagonal, graded faint to solid.
            Treat it with the same care the charts ask for.
          </p>
        </Reveal>
        <Reveal delay={80} className="mt-8 flex flex-wrap items-center gap-3">
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
        </Reveal>
      </header>

      {/* ── 01 · The mark ─────────────────────────────────────────────── */}
      <section className="mt-20">
        <SectionMark n="01">The mark</SectionMark>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <Reveal className="panel relative flex items-center justify-center overflow-hidden px-6 py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid-paper opacity-70"
            />
            <Brandmark size={132} className="relative drop-shadow-sm" />
          </Reveal>
          <Reveal delay={80} className="panel flex flex-col justify-center gap-5 p-7">
            <p className="text-fd-foreground">
              The three cells climb bottom-left to top-right, their fill grading from faint to
              solid. That grade is the same honest encoding the charts use — value carried by
              weight, not decoration. It borrows the ActivityGrid’s DNA, so the brand and the
              product read as one hand.
            </p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-fd-border pt-5">
              {[
                ["Container", "Superellipse · n 4.5"],
                ["Cells", "Three · graded fill"],
                ["Grid", "32 × 32 units"],
                ["Encoding", "Weight = value"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="mono-label">{k}</dt>
                  <dd className="mt-1 text-sm text-fd-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* ── 02 · Logo variants / downloads ────────────────────────────── */}
      <section className="mt-20">
        <SectionMark n="02">Logo variants</SectionMark>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ASSETS.map((a, i) => {
            const { src, bytes } = readAsset(a.file);
            return (
              <Reveal key={a.file} delay={i * 50} className="glass flex flex-col overflow-hidden">
                <div
                  className={
                    "relative flex min-h-[150px] items-center justify-center " +
                    (a.tile === "dark"
                      ? "bg-[#0a0b0f]"
                      : a.tile === "light"
                        ? "bg-[#efe9dd]"
                        : "bg-gradient-to-br from-[#efe9dd] to-[#0a0b0f]")
                  }
                >
                  {/* Plain <img>: the file IS the deliverable, and next/image
                      is a non-starter under output:'export'. */}
                  <img
                    src={`/brand/${a.file}`}
                    alt={`microcharts mark — ${a.name}`}
                    width={72}
                    height={72}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-fd-border px-3.5 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-fd-foreground">{a.name}</div>
                    <div className="mono-label mt-0.5 truncate opacity-70">{a.note}</div>
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
                <div className="mono-label flex items-center justify-between border-t border-fd-border/70 px-3.5 py-2 opacity-60">
                  <span>{a.file}</span>
                  <span className="tabular-nums">{(bytes / 1024).toFixed(1)} kB · svg</span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── 03 · Clear space & size ───────────────────────────────────── */}
      <section className="mt-20">
        <SectionMark n="03">Clear space &amp; size</SectionMark>
        <div className="grid gap-4 lg:grid-cols-2">
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
            <p className="max-w-xs text-center text-sm text-fd-muted-foreground">
              Keep clear space of at least{" "}
              <span className="text-fd-foreground">one cell-width</span> around the mark. Nothing —
              type, edges, other marks — enters the dashed field.
            </p>
          </Reveal>
          <Reveal delay={80} className="panel flex flex-col justify-center gap-6 p-8">
            <div className="flex items-end gap-7">
              {[
                { px: 16, label: "16 px", role: "Favicon · minimum" },
                { px: 24, label: "24 px", role: "Inline · UI" },
                { px: 40, label: "40 px", role: "Comfortable" },
              ].map((s) => (
                <div key={s.px} className="flex flex-col items-center gap-3">
                  <Brandmark size={s.px} />
                  <div className="text-center">
                    <div className="font-mono text-xs tabular-nums text-fd-foreground">
                      {s.label}
                    </div>
                    <div className="mono-label mt-0.5 opacity-70">{s.role}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="border-t border-fd-border pt-5 text-sm text-fd-muted-foreground">
              Below 16 px the cells lose the grade and the read collapses — never go smaller. The
              SVG scales cleanly above it to any size.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── 04 · Misuse ───────────────────────────────────────────────── */}
      <section className="mt-20">
        <SectionMark n="04">Don’t</SectionMark>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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
              svg: markInner("#14161d", "#14161d"),
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
            <Reveal key={d.label} delay={i * 40} className="glass flex flex-col overflow-hidden">
              <div className="relative flex min-h-[104px] items-center justify-center bg-[#efe9dd] dark:bg-[#14161d]">
                <svg viewBox="0 0 32 32" width="56" height="56" aria-hidden>
                  {d.svg}
                </svg>
                <span
                  aria-hidden
                  className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-[#c5521c] font-mono text-[11px] font-bold text-white"
                >
                  ✕
                </span>
              </div>
              <div className="border-t border-fd-border px-3 py-2 text-center">
                <span className="text-xs text-fd-muted-foreground">{d.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 05 · Color ────────────────────────────────────────────────── */}
      <section className="mt-20">
        <SectionMark n="05">Color</SectionMark>

        <p className="mb-5 max-w-2xl text-sm text-fd-muted-foreground">
          One accent token drives the whole system — chrome, links, and the charts’ emphasis. Cobalt
          is the default; five siblings swap in through the picker. Each is hand-tuned for light and
          dark. Click any chip to copy its hex.
        </p>
        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACCENTS.map((a) => (
            <div key={a.name} className="grid grid-cols-2 gap-2">
              <ColorSwatch hex={a.light} name={a.name} role="Light" />
              <ColorSwatch hex={a.dark} name={a.name} role="Dark" />
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <div className="mono-label mb-3">Neutrals</div>
            <div className="grid grid-cols-2 gap-2">
              <ColorSwatch hex="#efe9dd" name="Paper" role="Light" ring />
              <ColorSwatch hex="#17110a" name="Ink" role="Light" />
              <ColorSwatch hex="#0a0b0f" name="Paper" role="Dark" />
              <ColorSwatch hex="#e9e8e3" name="Ink" role="Dark" ring />
              <ColorSwatch hex="#faf7f1" name="Cell fill" role="Mark" ring />
            </div>
          </div>
          <div>
            <div className="mono-label mb-3">Semantic — direction never rides on color alone</div>
            <div className="grid grid-cols-2 gap-2">
              <ColorSwatch hex="#0b8a63" name="Positive" role="Light" />
              <ColorSwatch hex="#34d399" name="Positive" role="Dark" />
              <ColorSwatch hex="#c5521c" name="Negative" role="Light" />
              <ColorSwatch hex="#fb8c5a" name="Negative" role="Dark" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 06 · Type ─────────────────────────────────────────────────── */}
      <section className="mt-20">
        <SectionMark n="06">Type</SectionMark>
        <div className="grid gap-4 md:grid-cols-3">
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
            <Reveal key={t.name} delay={i * 60} className="panel flex flex-col gap-4 p-6">
              <div className={t.cls + " text-fd-foreground"}>{t.specimen}</div>
              <div className="mt-auto border-t border-fd-border pt-4">
                <div className="text-sm font-medium text-fd-foreground">{t.name}</div>
                <div className="mono-label mt-1">{t.role}</div>
                <p className="mt-2 text-sm text-fd-muted-foreground">{t.use}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 07 · The name ─────────────────────────────────────────────── */}
      <section className="mt-20">
        <SectionMark n="07">The name</SectionMark>
        <div className="grid gap-4 lg:grid-cols-2">
          <Reveal className="panel flex flex-col gap-4 p-7">
            <div className="flex items-center gap-3">
              <Brandmark size={30} />
              <span className="text-2xl font-semibold tracking-[-0.01em] text-fd-foreground">
                microcharts
              </span>
            </div>
            <ul className="mt-1 space-y-2.5 text-sm text-fd-muted-foreground">
              <li>
                <span className="text-fd-foreground">One lowercase word</span> — “microcharts,” even
                at the start of a sentence.
              </li>
              <li>Never “Microcharts,” “MicroCharts,” “micro charts,” or “µcharts.”</li>
              <li>
                The mark may pair with the wordmark or stand alone. Don’t redraw the wordmark.
              </li>
            </ul>
          </Reveal>
          <Reveal delay={80} className="panel flex flex-col justify-center gap-3 p-7">
            {[
              { k: "Name", v: "microcharts" },
              { k: "Package", v: SITE.pkg },
              { k: "Install", v: `pnpm add ${SITE.pkg}` },
            ].map((row) => (
              <div
                key={row.k}
                className="command-well flex items-center gap-2.5 py-2 pl-3.5 pr-1.5"
              >
                <span className="mono-label w-16 shrink-0">{row.k}</span>
                <code className="min-w-0 flex-1 truncate font-mono text-sm text-fd-foreground">
                  {row.v}
                </code>
                <CopyButton text={row.v} size={7} className="shrink-0" />
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Permission note ───────────────────────────────────────────── */}
      <Reveal className="mt-20 border-t border-fd-border pt-8">
        <p className="max-w-2xl text-sm text-fd-muted-foreground">
          Use the mark to link to or reference microcharts — a “built with,” a talk slide, an
          integration. Don’t modify it, use it as your own product’s mark, or imply endorsement. The
          library’s code is{" "}
          <a
            href={SITE.repo}
            target="_blank"
            rel="noreferrer noopener"
            className="link-underline text-fd-foreground"
          >
            MIT
          </a>
          . Questions? Reach out on{" "}
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
      </Reveal>
    </div>
  );
}
