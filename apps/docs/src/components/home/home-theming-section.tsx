import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionMark } from "@/components/home/section-mark";
import { ThemingDemo } from "@/components/home/theming-demo";
import { Reveal } from "@/components/ui/reveal";

/** Theming: the section re-themes itself through the real CSS custom
 *  properties. */
export function HomeThemingSection() {
  return (
    <section className="mx-auto max-w-shell px-4 py-12 sm:px-6">
      <SectionMark>theming</SectionMark>
      <div className="grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
        <Reveal>
          <h2 className="display text-[length:var(--text-fluid-h2)]">
            The whole palette, from your one brand color
          </h2>
          <p className="mt-4 max-w-md text-fd-muted-foreground">
            <code className="text-sm">defineTheme</code> derives a color-blind-safe palette and
            matched dark variants from one brand color. Pick a swatch: every chart re-themes through
            the same CSS custom properties your app would use, and positive stays green, negative
            stays vermillion.
          </p>
          <Link
            prefetch={false}
            href="/docs/theming"
            className="link-underline mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-fd-primary"
          >
            The full theming contract <ArrowRight className="size-4" />
          </Link>
        </Reveal>
        <Reveal delay={80}>
          <ThemingDemo />
        </Reveal>
      </div>
    </section>
  );
}
