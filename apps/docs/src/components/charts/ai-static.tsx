import { FileText, Braces, FileCode, ArrowUpRight } from "lucide-react";
import { AI_LOGOS } from "@/lib/ai-logos";

/**
 * Static (zero-JS) building blocks for the AI-native guide: the provider logo
 * wall (proof the plain-text format works anywhere) and the machine-readable
 * surface cards. Logos are inlined, normalized to `currentColor`, so they theme
 * with the page and ship no network requests.
 */

function Logo({ name, className }: { name: string; className?: string }) {
  const l = AI_LOGOS[name];
  if (!l) return null;
  return (
    <svg
      viewBox={l.viewBox}
      fill="currentColor"
      role="img"
      aria-label={l.label}
      className={className}
      dangerouslySetInnerHTML={{ __html: l.body }}
    />
  );
}

const GROUPS: { title: string; note: string; names: string[] }[] = [
  {
    title: "Chat assistants",
    note: "emit a chart block mid-reply",
    names: ["openai", "claude", "gemini", "perplexity", "mistral"],
  },
  {
    title: "Coding agents",
    note: "scaffold components from the API",
    names: ["cursor", "copilot", "windsurf", "claude"],
  },
  {
    title: "Frameworks & SDKs",
    note: "render tool output to charts",
    names: ["vercel", "langchain"],
  },
];

export function ProviderWall() {
  return (
    <div className="not-prose my-6 grid gap-3 sm:grid-cols-3">
      {GROUPS.map((g) => (
        <div key={g.title} className="panel flex flex-col gap-4 p-4">
          <div>
            <div className="text-sm font-medium text-fd-foreground">{g.title}</div>
            <div className="mono-label mt-0.5 opacity-70">{g.note}</div>
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-3">
            {g.names.map((n) => (
              <span
                key={n}
                className="flex items-center gap-1.5 text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                title={AI_LOGOS[n]?.label}
              >
                <Logo name={n} className="h-5 w-5 shrink-0" />
                <span className="text-[0.78rem]">{AI_LOGOS[n]?.label}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const SURFACES = [
  {
    href: "/llms.txt",
    label: "/llms.txt",
    note: "curated docs map",
    body: "A hand-curated index of the docs for LLM tools, with explicit “does not support” notes to head off hallucinations.",
    icon: FileText,
  },
  {
    href: "/llms-full.txt",
    label: "/llms-full.txt",
    note: "the full corpus",
    body: "Every doc page concatenated into one text file — drop the whole API into a context window at once.",
    icon: FileText,
  },
  {
    href: "/catalog.json",
    label: "/catalog.json",
    note: "every chart, typed",
    body: "Machine catalog: each chart’s name, import paths, data shape, and props — generated from the same registry that builds this site.",
    icon: Braces,
  },
  {
    href: "/docs/ai.md",
    label: "*.md mirrors",
    note: "clean Markdown",
    body: "Append .md to any docs page for a Markdown copy an agent can read without parsing HTML.",
    icon: FileCode,
  },
];

export function SurfaceCards() {
  return (
    <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
      {SURFACES.map((s) => (
        <a
          key={s.href}
          href={s.href}
          className="glass glass-lift group flex flex-col gap-2 p-4 no-underline"
        >
          <div className="flex items-center gap-2.5">
            <s.icon className="size-4 shrink-0 text-fd-primary" />
            <span className="font-mono text-sm text-fd-foreground">{s.label}</span>
            <span className="mono-label ml-auto opacity-70">{s.note}</span>
            <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
          </div>
          <p className="text-[0.82rem] leading-relaxed text-fd-muted-foreground">{s.body}</p>
        </a>
      ))}
    </div>
  );
}
