import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { describeSeries } from "@microcharts/react";
import { Sparkline } from "@microcharts/react/sparkline";
import { Reveal } from "@/components/ui/reveal";

const HERO = [3, 5, 4, 8, 6, 9];
const A11Y_ROWS = [
  { in: "[3, 5, 4, 8, 6, 9]", out: describeSeries(HERO) },
  { in: "[9, 7, 8, 4, 5, 2]", out: describeSeries([9, 7, 8, 4, 5, 2]) },
  { in: "[7]", out: describeSeries([7]) },
  { in: "[5, 5, 5, 5]", out: describeSeries([5, 5, 5, 5]) },
  { in: "[]", out: describeSeries([]) },
];

function SectionMark({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="mono-label text-fd-primary">{n}</span>
      <span className="h-px flex-1 bg-hairline" />
      <span className="mono-label">{children}</span>
    </div>
  );
}

export function HomeA11ySection() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark n="02">Reads itself aloud</SectionMark>
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
        <Reveal>
          <h2 className="display text-[length:var(--text-fluid-h2)]">
            Every chart writes its own description.
          </h2>
          <p className="mt-4 max-w-md text-fd-muted-foreground">
            The default accessible name is generated from the data, so there is no alt text to
            forget and no summary to drift. The same words a screen reader speaks are the words a
            crawler indexes and a model can quote back.
          </p>
          <div className="panel mt-6 p-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-8 items-center">
                <Sparkline data={HERO} width={92} height={26} curve="smooth" summary={false} />
              </span>
              <span className="mono-label">announced as</span>
            </div>
            <p className="text-lg leading-relaxed text-fd-foreground">
              &ldquo;Weekly revenue. {describeSeries(HERO)}&rdquo;
            </p>
          </div>
          <Link
            prefetch={false}
            href="/docs/accessibility"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-fd-primary link-underline"
          >
            How the summaries work <ArrowRight className="size-4" />
          </Link>
        </Reveal>

        <Reveal delay={80}>
          <div className="panel overflow-hidden">
            <div className="border-b border-hairline px-5 py-3">
              <span className="mono-label">honest on the hard inputs</span>
            </div>
            <ul>
              {A11Y_ROWS.map((r, i) => (
                <li
                  key={r.in}
                  className={
                    "grid grid-cols-1 gap-1 px-5 py-3.5 sm:grid-cols-[9.5rem_minmax(0,1fr)]" +
                    (i > 0 ? " border-t border-hairline" : "")
                  }
                >
                  <code className="font-mono text-[0.8rem] text-fd-primary">{r.in}</code>
                  <span className="text-[0.86rem] leading-relaxed text-fd-muted-foreground">
                    {r.out}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-sm text-fd-muted-foreground">
            Empty, single, flat, or reversed data gets an honest short sentence, never a broken
            chart. Direction is never color alone, and strokes clear 4.5:1 in light and dark.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
