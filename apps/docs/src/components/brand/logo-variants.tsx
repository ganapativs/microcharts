import Image from "next/image";
import { Download } from "lucide-react";
import { CopyButton } from "@/components/ui/copy";
import { ASSETS, readAsset } from "@/components/brand/shared";

export function BrandLogoVariants() {
  return (
    <section className="act">
      <div className="shell">
        <h2 className="display-2" style={{ maxWidth: "var(--m-head)" }}>
          Every version of the mark
        </h2>
        <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
          Cobalt is the primary one. There is an adaptive version for hosts that flip theme, two
          mono inks for when colour is not available, and two accent siblings. Every file below is
          the asset that ships under{" "}
          <code className="font-mono text-[0.86em]" style={{ color: "var(--ink)" }}>
            /brand
          </code>
          .
        </p>
        <div className="u-block grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ASSETS.map((a) => {
            const { src, bytes } = readAsset(a.file);
            return (
              <div key={a.file} className="plate flex flex-col overflow-hidden">
                <div className="bk-stage" data-tile={a.tile}>
                  <Image
                    src={`/brand/${a.file}`}
                    alt={`microcharts mark, ${a.name}`}
                    width={72}
                    height={72}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 px-3.5 pb-2.5 pt-3">
                  <div className="min-w-0">
                    <div
                      className="truncate font-mono text-[13px] font-medium tracking-[-0.03em]"
                      style={{ color: "var(--ink)" }}
                    >
                      {a.name}
                    </div>
                    <div className="kicker mt-1.5 truncate">{a.note}</div>
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
                <div
                  className="mono-s flex items-center justify-between gap-3 px-3.5 pb-2.5"
                  style={{ color: "var(--ink-3)" }}
                >
                  <span className="truncate">{a.file}</span>
                  <span className="shrink-0 tabular-nums">
                    {(bytes / 1024).toFixed(1)} kB · svg
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
