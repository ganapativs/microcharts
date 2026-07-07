import Link from "next/link";
import { ArrowRight, Braces, FileText, MessagesSquare, Terminal, Bot } from "lucide-react";
import { StreamDemo } from "@/components/charts/stream-demo";
import { Reveal } from "@/components/ui/reveal";

// The machine-readable surfaces are REAL routes — every link resolves. This is
// the substance behind "AI-native": a stable, generated contract, not a slogan.
const SURFACES = [
  { href: "/llms.txt", label: "llms.txt", note: "curated docs map", icon: FileText },
  { href: "/llms-full.txt", label: "llms-full.txt", note: "the full corpus", icon: FileText },
  {
    href: "/microcharts.catalog.json",
    label: "catalog.json",
    note: "every chart, typed",
    icon: Braces,
  },
];

// Where the format is read. Named honestly in prose — microcharts emits plain
// text + JSON, so any of these can consume it; no partnership implied.
const READERS = [
  { icon: MessagesSquare, label: "Chat assistants", ex: "ChatGPT · Claude" },
  { icon: Bot, label: "Coding agents", ex: "Cursor · Claude Code · Copilot" },
  { icon: Terminal, label: "CLIs & scripts", ex: "any agent runtime" },
];

export function AiNative() {
  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-10">
      {/* left — the thesis */}
      <div className="lg:sticky lg:top-24">
        <h2 className="display text-[length:var(--text-fluid-h2)]">
          Charts an agent can write, and a person can trust.
        </h2>
        <p className="mt-4 max-w-md text-fd-muted-foreground">
          Every chart is plain SVG with a generated, human-readable summary — the same sentence a
          screen reader speaks, a crawler indexes, and a model can quote. Emit a small{" "}
          <code className="font-mono text-[0.9em] text-fd-primary">chart</code> block in a stream
          and it becomes a real, accessible instrument.
        </p>

        {/* machine surfaces */}
        <div className="mt-7 flex flex-col gap-2">
          {SURFACES.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="glass glass-lift group flex items-center gap-3 px-4 py-2.5"
            >
              <s.icon className="size-4 text-fd-primary" />
              <span className="font-mono text-sm text-fd-foreground">{s.label}</span>
              <span className="mono-label ml-auto opacity-70">{s.note}</span>
              <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
            </a>
          ))}
        </div>

        {/* readers */}
        <div className="mt-7">
          <div className="mono-label mb-1.5">Works in the tools you use</div>
          <p className="mb-3 max-w-md text-[0.82rem] leading-relaxed text-fd-muted-foreground">
            A chart is just plain text and JSON — so anything that can read or write text can emit
            one and render it back.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {READERS.map((r) => (
              <div key={r.label} className="glass px-3 py-3">
                <r.icon className="size-4 text-fd-primary" />
                <div className="mt-2 text-[0.8rem] font-medium text-fd-foreground">{r.label}</div>
                <div className="mono-label mt-0.5 text-[0.56rem] opacity-70">{r.ex}</div>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/docs/ai"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-fd-primary link-underline"
        >
          The AI-native guide <ArrowRight className="size-4" />
        </Link>
      </div>

      {/* right — the live proof */}
      <Reveal>
        <StreamDemo />
      </Reveal>
    </div>
  );
}
