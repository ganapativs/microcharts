import { OneLineDemo, TypesetHero } from "@/components/lab/typeset-hero";
import { LabCtas, LabEyebrow, LabSub } from "@/components/lab/lab-shared";
import { CATALOG } from "@/lib/docs-facts";

/** Direction C — "Inside the Sentence": typography-first; the charts are
 *  grammar, not decoration. One orchestrated typeset-in, then quiet. */

export default function HeroCLab() {
  return (
    <section className="lab-c relative overflow-hidden">
      <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-20 sm:px-6 sm:pt-24">
        <LabEyebrow />
        <div className="mt-8">
          <TypesetHero />
        </div>
        <LabSub total={CATALOG.total} className="mt-8" />
        <div className="mt-9 flex flex-wrap items-end gap-x-10 gap-y-6">
          <LabCtas />
          <OneLineDemo />
        </div>
      </div>
    </section>
  );
}
