import { FileText, Braces, FileCode, ArrowUpRight } from "lucide-react";
import { AI_LOGOS } from "@/lib/ai-logos";
import { PROVIDER_GROUPS, MACHINE_SURFACES } from "@/lib/ai-providers";

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

export function ProviderWall() {
  return (
    <div className="not-prose my-6 flex flex-col gap-px overflow-hidden rounded-lg bg-hairline ring-1 ring-hairline">
      {PROVIDER_GROUPS.map((g) => (
        <div key={g.title} className="bg-fd-background p-4 sm:flex sm:items-start sm:gap-6">
          <div className="mb-3 shrink-0 sm:mb-0 sm:w-44">
            <div className="text-sm font-medium text-fd-foreground">{g.title}</div>
            <div className="mono-label mt-0.5 opacity-70">{g.note}</div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            {g.names.map((n) => (
              <span
                key={n}
                className="flex items-center gap-1.5 text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                title={AI_LOGOS[n]?.label}
              >
                <Logo name={n} className="h-[18px] w-[18px] shrink-0" />
                <span className="text-[0.78rem] whitespace-nowrap">{AI_LOGOS[n]?.label}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const SURFACE_ICON: Record<string, typeof FileText> = {
  "/llms.txt": FileText,
  "/llms-full.txt": FileText,
  "/catalog.json": Braces,
  "/docs/ai.md": FileCode,
};

export function SurfaceCards() {
  return (
    <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
      {MACHINE_SURFACES.map((s) => {
        const Icon = SURFACE_ICON[s.href] ?? FileText;
        return (
          <a
            key={s.href}
            href={s.href}
            className="glass glass-lift group flex flex-col gap-2 p-4 no-underline"
          >
            <div className="flex items-center gap-2.5">
              <Icon className="size-4 shrink-0 text-fd-primary" />
              <span className="font-mono text-sm text-fd-foreground">{s.label}</span>
              <span className="mono-label ml-auto opacity-70">{s.note}</span>
              <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
            </div>
            <p className="text-[0.82rem] leading-relaxed text-fd-muted-foreground">{s.body}</p>
          </a>
        );
      })}
    </div>
  );
}
