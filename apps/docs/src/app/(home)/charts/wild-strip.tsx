import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SHOWCASE } from "@/lib/showcase";
import { CATALOG } from "@/lib/docs-facts";

/**
 * End-of-catalog pointer. The example gallery lives at /examples, so this is one
 * line and one door into the seven real apps — not a second gallery, and not a
 * bordered card: the surface's actions are type and a rule, everywhere.
 */
export function WildStrip() {
  return (
    <section aria-label="Example apps built with microcharts" className="act">
      <div className="shell">
        <p className="lead" style={{ maxWidth: "var(--m-lead)" }}>
          {SHOWCASE.length} apps in this repo use these charts for real work. There is a trading
          terminal in there, a print magazine, an eval console.
        </p>
        <p className="mono u-block" style={{ color: "var(--ink-3)" }}>
          {SHOWCASE.length} apps · {CATALOG.total} types · 0 dependencies
        </p>
        <div className="mt-6">
          <Link prefetch={false} href="/examples" className="door group" data-primary>
            <span className="door-label">Browse the examples</span>
            <ArrowRight
              aria-hidden
              className="size-[1em] shrink-0 transition-transform duration-200 group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
