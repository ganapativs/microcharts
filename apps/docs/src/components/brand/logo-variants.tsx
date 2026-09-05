import { ASSETS, AssetTile } from "@/components/brand/shared";

export function BrandLogoVariants() {
  return (
    <section className="act">
      <div className="shell">
        <h2 className="display-2" style={{ maxWidth: "var(--m-head)" }}>
          Every version of the mark
        </h2>
        <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
          Cobalt is the primary one. There is a dark-theme cobalt, an adaptive version for hosts
          that flip theme, two mono inks for when color is not available, and two accent siblings.
          Every file below is the asset that ships under{" "}
          <code className="font-mono text-[0.86em]" style={{ color: "var(--ink)" }}>
            /brand
          </code>
          .
        </p>
        <div className="u-block grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ASSETS.map((a) => (
            <AssetTile key={a.file} asset={a} width={72} height={72} />
          ))}
        </div>
      </div>
    </section>
  );
}
