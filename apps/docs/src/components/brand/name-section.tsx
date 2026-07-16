import { Brandmark } from "@/components/brandmark";
import { CopyButton } from "@/components/ui/copy";
import { CommandLine } from "@/components/ui/command-line";
import { Reveal } from "@/components/ui/reveal";
import { SITE } from "@/lib/site";
import { SectionMark } from "@/components/brand/shared";

export function BrandNameSection() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark n="07">The name</SectionMark>
      <Reveal className="mb-8 max-w-2xl">
        <h2 className="display text-[length:var(--text-fluid-h2)]">One lowercase word.</h2>
        <p className="mt-4 max-w-xl text-fd-muted-foreground">
          Always “microcharts,” even at the start of a sentence. Never MicroCharts, micro charts, or
          µcharts.
        </p>
      </Reveal>
      <div className="grid items-stretch gap-3 lg:grid-cols-2">
        <Reveal className="panel flex h-full flex-col gap-5 p-7">
          <div className="flex items-center gap-3">
            <Brandmark size={30} />
            <span className="text-2xl font-semibold leading-none tracking-[-0.01em] text-fd-foreground">
              microcharts
            </span>
          </div>
          <ul className="space-y-2.5 text-sm text-fd-muted-foreground">
            <li>The mark may pair with the wordmark or stand alone.</li>
            <li>Don’t redraw the wordmark. Use the shipped lockup.</li>
          </ul>
        </Reveal>
        <Reveal delay={80} className="panel flex h-full flex-col overflow-hidden p-0">
          <dl className="grid h-full min-h-[8.25rem] grid-rows-3 divide-y divide-hairline">
            {[
              { k: "Name", v: "microcharts", cmd: false },
              { k: "Package", v: SITE.pkg, cmd: false },
              { k: "Install", v: `pnpm add ${SITE.pkg}`, cmd: true },
            ].map((row) => (
              <div
                key={row.k}
                className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-x-3 px-4"
              >
                <dt className="mono-label">{row.k}</dt>
                <dd className="min-w-0">
                  {row.cmd ? (
                    <CommandLine
                      command={row.v}
                      prompt={false}
                      className="block truncate text-sm"
                    />
                  ) : (
                    <code className="block truncate font-mono text-sm text-fd-foreground">
                      {row.v}
                    </code>
                  )}
                </dd>
                <CopyButton text={row.v} size={7} className="shrink-0" />
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
