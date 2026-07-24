import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SHOWCASE } from "@/lib/showcase";
import { CATALOG } from "@/lib/docs-facts";

/**
 * End-of-gallery pointer. The full example gallery lives at /examples now, so
 * this is deliberately a single slim band — after browsing the catalog at true
 * size, one line and one door into the seven real apps, not a second copy of
 * the gallery.
 */
export function WildStrip() {
  return (
    <section
      aria-label="Example apps built with microcharts"
      className="mx-auto mt-16 max-w-shell px-4 pb-20 sm:px-6"
    >
      <Link
        prefetch={false}
        href="/examples"
        className="group flex flex-col gap-3 rounded-2xl border border-hairline bg-[var(--glass-surface)] px-6 py-5 no-underline transition-colors hover:border-[color-mix(in_oklab,var(--accent)_40%,var(--hairline))] sm:flex-row sm:items-center sm:justify-between sm:gap-6"
      >
        <div className="flex min-w-0 flex-col gap-1">
          <span className="mono-label text-fd-primary">the examples</span>
          <p className="text-fd-foreground">
            The same catalog, carrying seven real products — a trading terminal, a print magazine,
            an eval console.
          </p>
          <span className="mono-label opacity-70">
            {SHOWCASE.length} apps · {CATALOG.total} types · 0 dependencies
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-fd-primary">
          Browse the examples
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </section>
  );
}
