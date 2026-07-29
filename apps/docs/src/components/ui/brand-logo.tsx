import { AI_LOGOS } from "@/lib/ai-logos";

/** Trusted module SVG markup → path nodes (no HTML string sink). */
export function TrustedSvgPaths({ markup }: { markup: string }) {
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

/** One brand mark from the shared registry, drawn in `currentColor`. */
export function BrandLogo({ name, className }: { name: string; className?: string }) {
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
