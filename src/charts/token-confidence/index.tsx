// <TokenConfidence> — which parts of generated text you should double-check
// (plan/25 §7, plan/17 F12). The documented exception to the SVG Chart root:
// THE TEXT IS THE CHART. Static, hook-free, RSC-safe. Confidence maps to three
// discrete tiers as typographic underlines (color + thickness + stroke style —
// never color-alone); confident tokens get NO mark so reading stays primary.
import type { CSSProperties, ReactNode } from "react";
import { devWarn } from "../../core/dev.js";
import {
  EN_TOKEN_CONFIDENCE,
  type TokenConfidenceStrings,
} from "../../core/strings-token-confidence.js";
import { tokenTierCounts, tokenTiers, type TieredToken, type TokenDatum } from "./geometry.js";

export type TokenConfidenceDatum = TokenDatum;

export interface TokenConfidenceProps {
  data: readonly TokenConfidenceDatum[];
  /** The lo/hi thresholds — the ONLY tuning. A gradient prop will never exist. */
  tiers?: [number, number] | undefined;
  /** `"all"` also marks confident tokens (hairline) for audit UIs. */
  show?: "flagged" | "all" | undefined;
  /** Appends the 1-line inline key ("― unsure · ⋯ guessing"). */
  legend?: boolean | undefined;
  format?: Intl.NumberFormatOptions | ((n: number) => string) | undefined;
  locale?: string | string[] | undefined;
  strings?: TokenConfidenceStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/** Shared summary — the three tier counts (the absence of marks IS the finding). */
export function tokenConfidenceSummary(
  tokens: readonly TieredToken[],
  strings: TokenConfidenceStrings,
): string {
  if (tokens.length === 0) return strings.noData;
  const c = tokenTierCounts(tokens);
  return strings.tokenConfidence(tokens.length, c.confident, c.unsure, c.guessing);
}

const CLASS: Record<string, string | undefined> = {
  unsure: "mc-tc-unsure",
  guessing: "mc-tc-guessing",
};

export function TokenConfidence(props: TokenConfidenceProps): ReactNode {
  const {
    data,
    tiers = [0.5, 0.8],
    show = "flagged",
    legend = false,
    strings = EN_TOKEN_CONFIDENCE,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  if (data.some((d) => !Number.isFinite(d.confidence)))
    devWarn("<TokenConfidence> non-finite confidence — treated as guessing.");

  const tokens = tokenTiers({ data, tiers });
  const accName =
    summary === false ? undefined : (summary ?? tokenConfidenceSummary(tokens, strings));
  const rootClass = className ? `mc-token-confidence ${className}` : "mc-token-confidence";
  const aria =
    summary === false
      ? { "aria-hidden": true as const }
      : {
          role: "img" as const,
          "aria-label": [title, accName].filter(Boolean).join(". ") || "Token confidence",
        };

  return (
    <span className={rootClass} style={style} id={id} {...aria}>
      {tokens.map((t, i) => {
        const cls = CLASS[t.tier] ?? (show === "all" ? "mc-tc-seen" : undefined);
        // eslint-disable-next-line react/no-array-index-key -- tokens repeat; index is the only stable key
        return cls ? (
          <span key={i} className={cls}>
            {t.token}
          </span>
        ) : (
          // eslint-disable-next-line react/no-array-index-key -- tokens repeat; index is the only stable key
          <span key={i}>{t.token}</span>
        );
      })}
      {legend ? (
        <span className="mc-tc-legend" aria-hidden="true">
          {" ― unsure · ⋯ guessing"}
        </span>
      ) : null}
      {children}
    </span>
  );
}
