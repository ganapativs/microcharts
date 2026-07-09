"use client";
// Interactive <FatDigits> (plan/24 #4). Announces the value + tier through a
// polite region on change; the weight eases via CSS on variable fonts (snaps
// otherwise), with no layout shift (tabular-nums). Wrapper focus only — the
// numeral is one value. Composes the static component.
import { useEffect, useRef, useState } from "react";
import { EN_FAT, type FatStrings } from "../../core/strings-fat.js";
import { FatDigits as StaticFatDigits, fatDigitsSummary, type FatDigitsProps } from "./index.js";

export interface InteractiveFatDigitsProps extends FatDigitsProps {
  /** Announce changes through a polite region (default true). */
  live?: boolean;
  strings?: FatStrings;
}

export function FatDigits(props: InteractiveFatDigitsProps): React.ReactNode {
  const {
    live = true,
    strings = EN_FAT,
    title,
    value,
    domain,
    encode = "value",
    tiers = 5,
    format,
    locale,
    ...rest
  } = props;
  const summary = fatDigitsSummary(value, { encode, tiers, domain, strings, format, locale });
  const prev = useRef(value);
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (live) setAnnounced(summary);
  }, [value, summary, live]);

  const label = [title, summary].filter(Boolean).join(". ") || undefined;

  return (
    <span
      className="mc-fat-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
    >
      <StaticFatDigits
        {...rest}
        value={value}
        domain={domain}
        encode={encode}
        tiers={tiers}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      />
      {live ? (
        <span
          aria-live="polite"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clip: "rect(0 0 0 0)",
            whiteSpace: "nowrap",
          }}
        >
          {announced}
        </span>
      ) : null}
    </span>
  );
}
