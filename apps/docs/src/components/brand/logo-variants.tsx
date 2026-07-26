import Image from "next/image";
import { Download } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { CopyButton } from "@/components/ui/copy";
import { ASSETS, readAsset, SectionMark } from "@/components/brand/shared";

export function BrandLogoVariants() {
  return (
    <section className="mx-auto max-w-shell px-4 py-14 sm:px-6">
      <SectionMark>Logo variants</SectionMark>
      <Reveal className="mb-8 max-w-2xl">
        <h2 className="display text-[length:var(--text-fluid-h2)]">Every version of the mark</h2>
        <p className="mt-4 max-w-xl text-fd-muted-foreground">
          Primary Ember, adaptive for light/dark hosts, mono inks, and two accent siblings. Each
          file is the shipped asset under{" "}
          <span className="font-mono text-fd-foreground">/brand</span>.
        </p>
      </Reveal>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ASSETS.map((a, i) => {
          const { src, bytes } = readAsset(a.file);
          return (
            <Reveal
              key={a.file}
              delay={i * 40}
              className="panel-soft flex flex-col overflow-hidden"
            >
              <div className="bk-stage" data-tile={a.tile}>
                <Image
                  src={`/brand/${a.file}`}
                  alt={`microcharts mark, ${a.name}`}
                  width={72}
                  height={72}
                />
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-hairline px-3.5 py-2.5">
                <div className="min-w-0 leading-5">
                  <div className="truncate text-sm font-medium leading-5 text-fd-foreground">
                    {a.name}
                  </div>
                  <div className="mono-label truncate leading-5 opacity-70">{a.note}</div>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <CopyButton text={src} size={8} />
                  <a
                    href={`/brand/${a.file}`}
                    download
                    aria-label={`Download ${a.file}`}
                    className="ghost-ctrl size-8"
                  >
                    <Download className="size-4" />
                  </a>
                </div>
              </div>
              <div className="mono-label flex items-center justify-between border-t border-hairline/70 px-3.5 py-2 leading-5 opacity-60">
                <span className="truncate">{a.file}</span>
                <span className="shrink-0 tabular-nums">{(bytes / 1024).toFixed(1)} kB · svg</span>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
