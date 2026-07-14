import { FileText, Braces, FileCode, ArrowUpRight } from "lucide-react";
import { AI_LOGOS } from "@/lib/ai-logos";
import { PROVIDER_GROUPS, MACHINE_SURFACES } from "@/lib/ai-providers";

/** Static AI guide blocks: provider logo wall + machine-surface cards. */

/** Trusted module SVG markup → path nodes (no HTML string sink). */
function TrustedSvgPaths({ markup }: { markup: string }) {
  return (
    <>
      {[...markup.matchAll(/<path\b([^>]*)\/?\s*>/gi)].map((m) => {
        const attrs = m[1] ?? "";
        const d = /\bd="([^"]*)"/.exec(attrs)?.[1];
        if (!d) return null;
        const fill = /\bfill="([^"]*)"/.exec(attrs)?.[1];
        const fillRule = /\bfill-rule="([^"]*)"/.exec(attrs)?.[1] as
          | "nonzero"
          | "evenodd"
          | undefined;
        const clipRule = /\bclip-rule="([^"]*)"/.exec(attrs)?.[1] as
          | "nonzero"
          | "evenodd"
          | undefined;
        return <path key={d} d={d} fill={fill} fillRule={fillRule} clipRule={clipRule} />;
      })}
    </>
  );
}

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
    >
      <TrustedSvgPaths markup={l.body} />
    </svg>
  );
}

function Mark({ name }: { name: string }) {
  return (
    <li className="flex items-center gap-2 text-fd-muted-foreground">
      <span className="grid size-6 shrink-0 place-items-center text-fd-muted-foreground/80">
        <Logo name={name} className="h-[17px] w-[17px]" />
      </span>
      <span className="truncate text-[0.8rem]">{AI_LOGOS[name]?.label}</span>
    </li>
  );
}

/**
 * The compatibility wall — a statement of breadth, not navigation (no
 * hover/cursor affordance; nothing here is clickable). `compact` (home) leads
 * each band with its flagship marks and drops the long tail to a light text
 * line; the full form (docs) shows every tool with a logo.
 */
export function ProviderWall({ compact = false }: { compact?: boolean }) {
  return (
    <div className="panel not-prose my-6 flex flex-col overflow-hidden">
      {PROVIDER_GROUPS.map((g) => {
        const lead = compact ? g.names.slice(0, g.lead) : g.names;
        const tail = compact ? g.names.slice(g.lead) : [];
        return (
          <div
            key={g.title}
            className="border-t border-hairline p-4 first:border-t-0 sm:grid sm:grid-cols-[11.5rem_1fr] sm:gap-x-7 sm:p-5"
          >
            <div className="mb-3.5 sm:mb-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-fd-foreground">{g.title}</span>
                <span className="mono-label tabular-nums opacity-45">
                  {g.names.length.toString().padStart(2, "0")}
                </span>
              </div>
              <div className="mono-label mt-1 leading-relaxed opacity-65">{g.note}</div>
            </div>
            <div>
              <ul
                className={
                  compact
                    ? "flex flex-wrap gap-x-5 gap-y-2.5"
                    : "grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3 lg:grid-cols-4"
                }
              >
                {lead.map((n) => (
                  <Mark key={n} name={n} />
                ))}
              </ul>
              {tail.length > 0 && (
                <p className="mt-2.5 text-[0.75rem] leading-relaxed text-fd-muted-foreground/70">
                  {tail.map((n, i) => (
                    <span key={n}>
                      {i > 0 && <span className="opacity-40"> · </span>}
                      {AI_LOGOS[n]?.label}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>
        );
      })}
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
          <div key={s.href} className="glass glass-lift group flex flex-col gap-2 p-4">
            <a href={s.href} className="flex flex-col gap-2 no-underline">
              <div className="flex items-center gap-2.5">
                <Icon className="size-4 shrink-0 text-fd-primary" />
                <span className="font-mono text-sm text-fd-foreground">{s.label}</span>
                <span className="mono-label ml-auto opacity-70">{s.note}</span>
                <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
              </div>
              <p className="text-[0.82rem] leading-relaxed text-fd-muted-foreground">{s.body}</p>
            </a>
            {s.aux && (
              <a
                href={s.aux.href}
                className="inline-flex w-fit items-center gap-1 font-mono text-xs text-fd-primary/80 no-underline transition-colors hover:text-fd-primary hover:underline"
              >
                {s.aux.label}
                <ArrowUpRight className="size-3" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
