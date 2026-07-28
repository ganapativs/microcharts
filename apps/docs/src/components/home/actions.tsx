import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SITE } from "@/lib/site";
import { SETUP_HREF } from "@/components/ui/setup-with-ai";
import { CopyLine } from "./copy-line";

/**
 * The page's two action rows: a primary door, a secondary door, the install
 * command and the AI setup link. `SETUP_HREF` is exported from one place
 * site-wide so the AI door cannot drift.
 */

function Door({
  href,
  primary,
  children,
}: {
  href: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  // Default prefetch: these are the home page's primary exits (few links).
  return (
    <Link href={href} className="door group" data-primary={primary || undefined}>
      <span className="door-label">{children}</span>
      <ArrowRight
        aria-hidden
        className="size-[1em] shrink-0 transition-transform duration-200 group-hover:translate-x-1"
      />
    </Link>
  );
}

/** The AI door, a quiet mono peer beside the command rather than a third heading. */
function SetupLink() {
  return (
    <Link
      href={SETUP_HREF}
      className="ulink group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em]"
      style={{ color: "var(--ink-2)" }}
    >
      <Sparkles aria-hidden className="size-3.5 shrink-0" />
      Set up with AI
      <ArrowRight aria-hidden className="size-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Act I: start, or browse the catalog. Install + AI setup under the doors. */
export function HeroActions() {
  return (
    <div className="mt-9 grid justify-items-start gap-6 sm:mt-10">
      <div className="flex flex-wrap items-baseline gap-x-9 gap-y-4">
        <Door href="/docs/quickstart" primary>
          Get started
        </Door>
        <Door href="/charts">Browse the catalog</Door>
      </div>
      <div className="grid justify-items-start gap-y-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-x-3.5">
        <CopyLine text={`pnpm add ${SITE.pkg}`} />
        <span
          aria-hidden
          className="hidden select-none sm:-ml-1.5 sm:mr-1.5 sm:inline"
          style={{ color: "var(--rule-2)" }}
        >
          /
        </span>
        <SetupLink />
      </div>
    </div>
  );
}

/** Colophon: agent path first, docs second. */
export function ClosingActions() {
  return (
    <div className="mt-9 grid justify-items-start gap-6 sm:mt-12">
      <div className="flex flex-wrap items-baseline gap-x-9 gap-y-4">
        <Door href={SETUP_HREF} primary>
          Set up with AI
        </Door>
        <Door href="/docs">Read the docs</Door>
      </div>
      <CopyLine text={`pnpm add ${SITE.pkg}`} />
    </div>
  );
}
