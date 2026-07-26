// <FatDigits> — which numbers in a dense column are big, before you read them.
// The numeral is the exact value; font-WEIGHT is a redundant preattentive tier
// (5 or 3 ordinal steps). Adapted from FatFonts to discrete weights on the
// inherited font, because a custom font would break zero-dep.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { EN_FAT, type FatStrings } from "../../core/strings-fat.js";
import { makeFormatter, type Format } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
import { fatDigitsGeometry, fatTier, type FatTiers } from "./geometry.js";

export interface FatDigitsProps {
  value: number;
  /** Range that maps `value` to a weight tier (value mode). */
  domain?: readonly [number, number] | undefined;
  /** `value` (default) weights the whole numeral; `digit` weights each digit. */
  encode?: "value" | "digit" | undefined;
  /** Weight steps: 5 (default) or 3. */
  tiers?: FatTiers | undefined;
  fontSize?: number | undefined;
  format?: Format | undefined;
  locale?: string | string[] | undefined;
  strings?: FatStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const PAD = 2;

export function fatDigitsSummary(
  value: number,
  opts: {
    encode?: "value" | "digit" | undefined;
    tiers?: FatTiers | undefined;
    domain?: readonly [number, number] | undefined;
    strings?: FatStrings | undefined;
    format?: Format | undefined;
    locale?: string | string[] | undefined;
  } = {},
): string {
  const { encode = "value", tiers = 5, domain, strings = EN_FAT, format, locale } = opts;
  if (!isFiniteValue(value)) return strings.noData;
  const formatted = makeFormatter(format, locale)(value);
  if (encode === "digit") return strings.fatDigitsPlain(formatted);
  return strings.fatDigits(formatted, fatTier(value, domain, tiers).tier, tiers);
}

export function FatDigits(props: FatDigitsProps): ReactNode {
  const {
    value,
    domain,
    encode = "value",
    tiers = 5,
    fontSize = 14,
    format,
    locale,
    strings = EN_FAT,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const formatted = isFiniteValue(value) ? makeFormatter(format, locale)(value) : "";
  const geo = fatDigitsGeometry({ formatted, value, domain, tiers, encode, fontSize, pad: PAD });
  const accName =
    summary === false
      ? false
      : (summary ?? fatDigitsSummary(value, { encode, tiers, domain, strings, format, locale }));

  return (
    <Chart
      width={geo.width}
      height={geo.height}
      title={title}
      summary={accName}
      id={id}
      // The mark is a numeral, so it has to land where a numeral lands. The box
      // is 1.4× the font size around a single run centred at its middle, so
      // unseated the digits float a third of a line above the baseline. Centring
      // puts the run's own optical middle on the cap band, which is where type of
      // the same size sits. One centred run makes the box symmetric by
      // construction, so the frame is the plot box.
      seat={{ mode: "center", top: 0, bottom: geo.height }}
      className={className ? `mc-fat ${className}` : "mc-fat"}
      style={{ ...style, "--mc-label-size": `${fontSize}px` } as CSSProperties}
    >
      {formatted ? (
        <text x={geo.x} y={geo.y} fontSize={fontSize} dominantBaseline="central" textAnchor="start">
          {geo.text ? <tspan style={{ fontWeight: geo.text.weight }}>{geo.text.str}</tspan> : null}
          {geo.glyphs?.map((g, i) => (
            // digit position is the identity — no data-unique key exists
            // oxlint-disable-next-line no-array-index-key
            <tspan key={i} style={{ fontWeight: g.weight }}>
              {g.char}
            </tspan>
          ))}
        </text>
      ) : null}
      {children}
    </Chart>
  );
}
