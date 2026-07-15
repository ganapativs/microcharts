import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { InstallCommand } from "@/components/ui/copy";

/** Shared first-fold content — identical copy across all three lab heroes so
 *  the comparison is purely visual thesis, never content. */

export function LabEyebrow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${className}`}>
      {["Zero dependencies", "AI-native", "Accessible by default", "RSC-safe"].map((t, i) => (
        <span key={t} className="mono-label">
          {i > 0 && <span className="mr-2 text-hairline">/</span>}
          {t}
        </span>
      ))}
    </div>
  );
}

export function LabSub({ total, className = "" }: { total: number; className?: string }) {
  return (
    <p className={`max-w-xl text-lg leading-relaxed text-fd-muted-foreground ${className}`}>
      Word-sized charts for React. {total} types that sit inside a sentence, a table cell, or a
      streamed reply, where a full chart library would be too heavy and too loud.
    </p>
  );
}

export function LabCtas({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/docs/quickstart#set-up-with-an-ai-agent"
          className="cta-accent group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-transform hover:-translate-y-0.5"
        >
          <Sparkles className="size-4" />
          Set up with AI
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <InstallCommand />
      </div>
      <div className="mt-4">
        <Link
          href="/docs"
          aria-label="Read the docs — introduction"
          className="group inline-flex items-center gap-2 text-fd-muted-foreground transition-colors hover:text-fd-foreground"
        >
          <span className="mono-label">
            the full story <span className="text-hairline">·</span>{" "}
            <span className="underline decoration-1 underline-offset-[5px] [text-decoration-color:color-mix(in_oklab,var(--accent)_45%,transparent)] transition-[text-decoration-color] group-hover:[text-decoration-color:var(--accent)]">
              read the docs
            </span>
          </span>
          <ArrowRight className="size-3.5 text-fd-primary transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
