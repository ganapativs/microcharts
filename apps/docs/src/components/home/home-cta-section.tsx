import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export function HomeCtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="panel grid-paper flex flex-col items-center gap-6 px-6 py-16 text-center">
        <h2 className="display max-w-2xl text-[length:var(--text-fluid-h2)]">
          Give your data a smaller voice.
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            prefetch={false}
            href="/docs/quickstart"
            className="cta-accent inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
          >
            Get started <ArrowRight className="size-4" />
          </Link>
          <a
            href="/llms.txt"
            className="cta-ghost inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium"
          >
            Open /llms.txt <ArrowUpRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
