import { Sparkline } from "@microcharts/react/sparkline";
import { SparkBar } from "@microcharts/react/sparkbar";
import { SilkShader } from "@/components/lab/silk-shader";
import { StreamVignette } from "@/components/home/stream-vignette";
import { LabCtas, LabEyebrow, LabSub } from "@/components/lab/lab-shared";
import { CATALOG } from "@/lib/docs-facts";

/** Direction A — "Silk & Ink": flowing silk shader under crisp ink type, the
 *  streamed AI reply card in a reading serif as the signature element. */

const TREND = [3, 5, 4, 8, 6, 9, 7, 11];

function Word({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden className="hx-word">
      {children}
    </span>
  );
}

export default function HeroALab() {
  return (
    <section className="lab-a relative overflow-hidden">
      <div aria-hidden className="lab-silk-fallback pointer-events-none absolute inset-0 -z-20" />
      <SilkShader className="pointer-events-none absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[46%] grid-paper opacity-50"
      />
      {/* ink veil — guarantees copy contrast over the brightest silk */}
      <div aria-hidden className="lab-veil pointer-events-none absolute inset-0 -z-10" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-16 sm:px-6 sm:pb-16 sm:pt-18 lg:grid-cols-[1.06fr_0.94fr] lg:gap-14">
        <div>
          <LabEyebrow />
          <h1 className="display mt-5 text-balance text-[2.3rem] leading-[1.05] text-fd-foreground sm:text-[3rem] lg:text-[3.65rem] xl:text-[3.9rem]">
            Small enough for a model to{" "}
            <span className="whitespace-nowrap">
              write
              <Word>
                <Sparkline data={TREND} curve="smooth" width={60} height={20} summary={false} />
              </Word>
              ,
            </span>{" "}
            sharp enough for a person to{" "}
            <span className="whitespace-nowrap">
              trust
              <Word>
                <SparkBar data={TREND} width={52} height={20} summary={false} />
              </Word>
              .
            </span>
          </h1>
          <LabSub total={CATALOG.total} className="mt-6" />
          <LabCtas className="mt-8" />
        </div>

        <div className="lab-serif-reply">
          <StreamVignette />
        </div>
      </div>
    </section>
  );
}
