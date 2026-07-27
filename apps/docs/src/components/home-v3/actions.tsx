import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SITE } from "@/lib/site";
import { SETUP_HREF } from "@/components/ui/setup-with-ai";
import { CopyLine } from "./copy-line";

/**
 * The page's two action rows.
 *
 * The ELEMENTS and destinations are the current home page's on purpose — a primary
 * door, a secondary door, the install command, and the AI setup link, pointing at
 * `/docs/quickstart`, `/charts`, `/docs` and `SETUP_HREF`. Two homepages arguing
 * the same product should not disagree about what a reader does next, and
 * `SETUP_HREF` is exported from one place site-wide so the AI door cannot drift.
 *
 * The LOOK is not. A pair of filled and outlined pills was tried and cut: this
 * page has no filled surfaces, no shadows and no rounded buttons anywhere else, so
 * two of them landed in the fold looking like a widget from another site. Here the
 * hierarchy is carried the way the rest of the page carries it — type and ink. The
 * primary is set at lead size on the accent over a 2px rule; the secondary is the
 * same shape one ink step back over a hairline. Both take an arrow, because both
 * go somewhere.
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
  return (
    <Link prefetch={false} href={href} className="door group" data-primary={primary || undefined}>
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
      prefetch={false}
      href={SETUP_HREF}
      className="u group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em]"
      style={{ color: "var(--ink-2)" }}
    >
      <Sparkles aria-hidden className="size-3.5 shrink-0" />
      Set up with AI
      <ArrowRight aria-hidden className="size-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Act I: start, or go and look at the catalog first. */
export function HeroActions({ catalogTotal }: { catalogTotal: number }) {
  return (
    <div className="mt-9 grid justify-items-start gap-6 sm:mt-10">
      <div className="flex flex-wrap items-baseline gap-x-9 gap-y-4">
        <Door href="/docs/quickstart" primary>
          Get started
        </Door>
        <Door href="/charts">Browse {catalogTotal} charts</Door>
      </div>
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
        <CopyLine text={`pnpm add ${SITE.pkg}`} />
        <span aria-hidden className="select-none" style={{ color: "var(--rule-2)" }}>
          /
        </span>
        <SetupLink />
      </div>
    </div>
  );
}

/** The colophon: the same doors, in the order a reader who reached the end wants
 *  them — the agent path first, the reference second. */
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
