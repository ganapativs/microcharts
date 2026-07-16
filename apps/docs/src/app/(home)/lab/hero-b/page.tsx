import { LivingField } from "@/components/lab/living-field";
import { HeadlineBars, HeadlineSpark } from "@/components/lab/field-headline-marks";
import { LabCtas, LabEyebrow, LabSub } from "@/components/lab/lab-shared";
import { CATALOG } from "@/lib/docs-facts";

/** Direction B — "The Living Field": the fold's background IS the catalog — a
 *  drifting field of faint real microcharts; a heavy display headline on top. */

export default function HeroBLab() {
  return (
    <section className="lab-b relative overflow-hidden">
      <LivingField />
      {/* readability veil between field and copy */}
      <div aria-hidden className="lab-b-veil pointer-events-none absolute inset-0 -z-[5]" />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-24">
        <LabEyebrow className="justify-center" />
        <h1 className="display lab-b-headline mt-6 text-balance text-[2.6rem] leading-[1.02] text-fd-foreground sm:text-[3.6rem] lg:text-[4.4rem]">
          Small enough for a model to{" "}
          <span className="whitespace-nowrap">
            write
            <HeadlineSpark />,
          </span>{" "}
          sharp enough for a person to{" "}
          <span className="whitespace-nowrap">
            trust
            <HeadlineBars />.
          </span>
        </h1>
        <LabSub total={CATALOG.total} className="mt-7 text-center" />
        <LabCtas className="mt-9 flex flex-col items-center [&>div:first-child]:justify-center" />
      </div>
    </section>
  );
}
