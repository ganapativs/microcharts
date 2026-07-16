import { Reveal } from "@/components/ui/reveal";

/** Numbered section rule — `01 ───── the problem`. One definition, every section. */
export function SectionMark({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <Reveal className="mb-8 flex items-center gap-3">
      <span className="mono-label text-fd-primary">{n}</span>
      <span className="h-px flex-1 bg-hairline" />
      <span className="mono-label">{children}</span>
    </Reveal>
  );
}
