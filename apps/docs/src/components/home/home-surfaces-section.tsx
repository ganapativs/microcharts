import type { ReactNode } from "react";
import { Sparkline } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar/interactive";
import { Delta } from "@microcharts/react/delta/interactive";
import { SectionMark } from "@/components/home/section-mark";
import { Reveal } from "@/components/ui/reveal";

/** Charts in situ: a written report + small placements (cell / KPI / tab / sentence). */

const BOOKINGS = [18, 22, 20, 27, 25, 31, 29, 34, 33, 38, 41, 46];

function Where({ children }: { children: ReactNode }) {
  return <span className="mono-label opacity-60">{children}</span>;
}

function ReportSurface() {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="mono-label opacity-60">Q3 review · finance</span>
      <h3 className="display text-lg leading-snug text-fd-foreground">
        Revenue held its climb into Q3.
      </h3>
      <p className="hv-reply-body text-[0.95rem] leading-relaxed text-fd-foreground">
        Bookings closed the quarter up{" "}
        <span className="mc-inline">
          <Sparkline data={BOOKINGS} summary={false} width={56} height={15} dots="none" />
        </span>{" "}
        <Delta value={0.184} summary={false} /> against plan, with new-logo mix steady.
      </p>
      <figure className="plate-inner mt-0.5 p-3.5">
        <SparkBar data={BOOKINGS} summary={false} width={340} height={48} className="w-full" />
        <figcaption className="mono-label mt-2 opacity-60">
          monthly bookings, $000 · fig. 3
        </figcaption>
      </figure>
    </div>
  );
}

function PlacementQuad() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className="plate-inner flex flex-col gap-1.5 p-3">
        <Where>table cell</Where>
        <table className="mc-inline-table w-full text-[0.82rem] tabular-nums">
          <thead className="sr-only">
            <tr>
              <th scope="col">Region</th>
              <th scope="col">Trend</th>
            </tr>
          </thead>
          <tbody className="[&>tr+tr]:border-t [&>tr+tr]:border-hairline">
            <tr>
              <td className="py-1 pr-2 text-fd-muted-foreground">EU</td>
              <td className="py-1">
                <Sparkline
                  data={[12, 14, 13, 18, 20]}
                  summary={false}
                  width={54}
                  height={14}
                  dots="none"
                />
              </td>
            </tr>
            <tr>
              <td className="py-1 pr-2 text-fd-muted-foreground">US</td>
              <td className="py-1">
                <Sparkline
                  data={[22, 19, 24, 21, 27]}
                  summary={false}
                  width={54}
                  height={14}
                  dots="none"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="plate-inner flex flex-col gap-1.5 p-3">
        <Where>KPI card</Where>
        <div className="flex items-baseline gap-1.5">
          <span className="display text-xl leading-none tabular-nums">114%</span>
          <Delta value={0.03} summary={false} />
        </div>
        <span className="mono-label opacity-70">net revenue retention</span>
      </div>

      <div className="plate-inner col-span-2 flex flex-col gap-2 p-3">
        <Where>tab header</Where>
        <div className="flex items-center gap-4 text-[0.82rem]">
          <span className="flex items-center gap-1.5 border-b-2 border-[color:var(--accent)] pb-1 font-medium text-fd-foreground">
            Traffic
            <Sparkline
              data={[8, 9, 11, 10, 13, 16]}
              summary={false}
              width={44}
              height={13}
              dots="none"
            />
          </span>
          <span className="flex items-center gap-1.5 pb-1 text-fd-muted-foreground">
            Errors
            <Sparkline
              data={[6, 5, 6, 4, 3, 2]}
              summary={false}
              width={44}
              height={13}
              dots="none"
            />
          </span>
        </div>
      </div>

      <div className="plate-inner col-span-2 flex flex-col gap-1.5 p-3">
        <Where>a sentence</Where>
        <p className="text-[0.9rem] leading-relaxed text-fd-foreground">
          Deploys are healthy this week{" "}
          <span className="mc-inline">
            <Sparkline
              data={[3, 2, 4, 3, 5, 4, 6]}
              summary={false}
              width={62}
              height={16}
              curve="smooth"
              dots="minmax"
            />
          </span>{" "}
          and error budget is holding.
        </p>
      </div>
    </div>
  );
}

export function HomeSurfacesSection() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark>where they live</SectionMark>

      <Reveal className="mb-10 max-w-md">
        <h2 className="display text-[length:var(--text-fluid-h2)]">
          They sit where your text already is
        </h2>
        <p className="mt-4 text-fd-muted-foreground">
          Both mockups below are rendered live from the library, down to the sparkline inside the
          table cell.
        </p>
      </Reveal>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Reveal className="panel-soft flex flex-col gap-3 p-5">
          <Where>rendered report</Where>
          <ReportSurface />
        </Reveal>
        <Reveal className="panel-soft flex flex-col gap-3 p-5">
          <Where>the small placements</Where>
          <PlacementQuad />
        </Reveal>
      </div>
    </section>
  );
}
