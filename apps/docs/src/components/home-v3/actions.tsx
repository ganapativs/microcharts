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

/** Act I: start, or go and look at the catalog first.
 *
 *  The second door used to read "Browse 106 charts". The fold could print that
 *  figure three times in one screen — here, in the paragraph above, and in
 *  whichever rotating claim was on. The claim keeps it, because there the number
 *  is doing work inside a sentence; a door only has to say where it goes. */
export function HeroActions() {
  return (
    <div className="mt-9 grid justify-items-start gap-6 sm:mt-10">
      <div className="flex flex-wrap items-baseline gap-x-9 gap-y-4">
        <Door href="/docs/quickstart" primary>
          Get started
        </Door>
        <Door href="/charts">Browse the catalog</Door>
      </div>
      {/* Two rows on a phone, one row from `sm` up.

          The separator is a SEPARATOR: it only means anything between two things
          on the same line. Left to wrap, the row broke after it and the slash
          ended up stranded at the end of the first line, pointing at nothing.
          Below `sm` the two commands stack and the slash goes with the layout it
          belonged to, rather than being kept and re-punctuated. */}
      <div className="grid justify-items-start gap-y-2.5 sm:flex sm:flex-wrap sm:items-center sm:gap-x-3.5">
        <CopyLine text={`pnpm add ${SITE.pkg}`} />
        {/* Pulled 6px left of centre, on purpose. The gaps either side are an
            equal 14px of BOX, but the copy button before it carries 12px of its
            own padding after its icon, so the ink either side measured 26px left
            against 14px right and the slash sat visibly closer to the AI link.
            Optical centring, which is the only kind that matters here. */}
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
