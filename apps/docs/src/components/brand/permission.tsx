import { Download } from "lucide-react";
import { SITE } from "@/lib/site";

/** The close. Same shape as every other page's close on this surface: a claim,
 *  a paragraph, and one door — not a panel with a button in it. */
export function BrandPermission() {
  return (
    <section className="act">
      <div className="shell">
        <h2 className="display-2" style={{ maxWidth: "var(--m-head)" }}>
          What the kit is for
        </h2>
        <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
          Use it to link to or reference microcharts: a &ldquo;built with&rdquo; badge, a talk
          slide, an integration. Don&rsquo;t modify the mark, use it as your own product&rsquo;s
          mark, or imply endorsement. The code is{" "}
          <a href={SITE.repo} target="_blank" rel="noreferrer noopener" className="ulink">
            MIT
          </a>
          . Questions?{" "}
          <a href={SITE.authorX} target="_blank" rel="noreferrer noopener" className="ulink">
            {SITE.authorXHandle}
          </a>
          .
        </p>
        <div className="mt-9">
          <a href="/brand/microcharts-brand-kit.zip" download className="door group" data-primary>
            <Download aria-hidden className="size-[0.9em] shrink-0" />
            <span className="door-label">Download the kit</span>
          </a>
        </div>
      </div>
    </section>
  );
}
