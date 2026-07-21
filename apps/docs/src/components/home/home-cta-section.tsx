import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InstallCommand } from "@/components/ui/copy";
import { SetupWithAi } from "@/components/ui/setup-with-ai";

/** Final CTA — the quiet close: Set up with AI, docs, package familiarity. */
export function HomeCtaSection() {
  return (
    <section className="py-14">
      <div className="mx-auto max-w-shell px-4 sm:px-6">
        <div className="panel grid-paper flex flex-col items-center gap-6 px-6 pb-20 pt-16 text-center sm:pb-24">
          <h2 className="display max-w-2xl text-[length:var(--text-fluid-h2)]">
            Give your interface a quieter voice.
          </h2>
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <SetupWithAi className="px-5" />
              <Link
                prefetch={false}
                href="/docs"
                className="cta-ghost inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
              >
                Read the docs <ArrowRight className="size-4" />
              </Link>
            </div>
            <InstallCommand className="border-[color-mix(in_oklab,var(--hairline)_85%,transparent)] bg-[var(--color-fd-card)] shadow-[var(--glass-shadow)]" />
          </div>
        </div>
      </div>
    </section>
  );
}
