import { Download } from "lucide-react";
import { SITE } from "@/lib/site";

export function BrandPermission() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
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
  );
}
