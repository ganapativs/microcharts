import { Brandmark } from "@/components/brandmark";
import { CopyButton } from "@/components/ui/copy";
import { CommandLine } from "@/components/ui/command-line";
import { SITE } from "@/lib/site";

export function BrandNameSection() {
  return (
    <section className="act">
      <div className="shell">
        <h2 className="display-2" style={{ maxWidth: "var(--m-head)" }}>
          Writing the name
        </h2>
        <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
          Always &ldquo;microcharts,&rdquo; even at the start of a sentence. Never MicroCharts,
          micro charts, or µcharts.
        </p>
        <div className="u-block grid items-stretch gap-3 lg:grid-cols-2">
          <div className="plate flex h-full flex-col gap-6 p-7">
            <div className="flex items-center gap-3">
              <Brandmark size={30} />
              <span
                className="font-display text-2xl font-semibold leading-none tracking-[-0.016em]"
                style={{ color: "var(--ink)" }}
              >
                microcharts
              </span>
            </div>
            <ul className="prose space-y-2.5 text-[0.92rem]">
              <li>The mark may pair with the wordmark or stand alone.</li>
              <li>
                Don&rsquo;t redraw the wordmark. Take{" "}
                <a href="/brand/lockup.svg" download className="ulink">
                  lockup.svg
                </a>
                .
              </li>
            </ul>
          </div>
          <div className="plate flex h-full flex-col overflow-hidden">
            <dl className="grid h-full min-h-[8.25rem] grid-rows-3">
              {[
                { k: "Name", v: "microcharts", cmd: false },
                { k: "Package", v: SITE.pkg, cmd: false },
                { k: "Install", v: `pnpm add ${SITE.pkg}`, cmd: true },
              ].map((row, i) => (
                <div
                  key={row.k}
                  className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-x-3 px-4"
                  style={i > 0 ? { borderTop: "1px solid var(--rule)" } : undefined}
                >
                  <dt className="kicker">{row.k}</dt>
                  <dd className="min-w-0">
                    {row.cmd ? (
                      <CommandLine command={row.v} prompt={false} className="mono block truncate" />
                    ) : (
                      <code
                        className="mono block truncate"
                        style={{ color: "var(--ink)", fontSize: "0.82rem" }}
                      >
                        {row.v}
                      </code>
                    )}
                  </dd>
                  <CopyButton text={row.v} size={7} className="shrink-0" />
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
