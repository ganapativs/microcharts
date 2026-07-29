import { AssetTile, LOCKUPS, WORDMARKS } from "@/components/brand/shared";

/** The mark set with the name, and the name on its own. Both ship as outlines,
 *  which is the point of the section: the page tells you not to redraw the
 *  wordmark, so the wordmark has to be a file you can take. */
export function BrandLockupSection() {
  return (
    <section className="act">
      <div className="shell">
        <h2 className="display-2" style={{ maxWidth: "var(--m-head)" }}>
          The lockup, and the name alone
        </h2>
        <p className="prose u-lede" style={{ maxWidth: "var(--m-prose)" }}>
          The lockup holds the mark at 1.375&times; the type size with a 0.625&nbsp;em gap &mdash;
          the same proportions this site&rsquo;s nav uses. The name is set in Open Runde 600 at
          &minus;0.016&nbsp;em and shipped as outlines, so it renders correctly on a machine that
          has never installed the font.
        </p>
        <div className="u-block grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LOCKUPS.map((a) => (
            <AssetTile key={a.file} asset={a} width={200} height={36} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {WORDMARKS.map((a) => (
            <AssetTile key={a.file} asset={a} width={180} height={25} />
          ))}
        </div>
      </div>
    </section>
  );
}
