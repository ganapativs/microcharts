import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { InstallCommand } from "@/components/ui/copy";

/** Final CTA — the quiet close, on the page's own field (the dark band
 *  stays section 05's move; twice would make it wallpaper). */
export function HomeCtaSection() {
  return (
    <section className="py-14">
      <div className="mx-auto max-w-shell px-4 sm:px-6">
        <div className="panel grid-paper flex flex-col items-center gap-6 px-6 py-16 text-center">
          <h2 className="display max-w-2xl text-[length:var(--text-fluid-h2)]">
            Give your interface a quieter voice.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              prefetch={false}
              href="/docs/quickstart#set-up-with-an-ai-agent"
              className="cta-accent inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
            >
              <Sparkles className="size-4" />
              Set up with AI
            </Link>
            <Link
              prefetch={false}
              href="/docs"
              className="cta-ghost inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
            >
              Read the docs <ArrowRight className="size-4" />
            </Link>
          </div>
          <InstallCommand />
        </div>
      </div>
    </section>
  );
}
