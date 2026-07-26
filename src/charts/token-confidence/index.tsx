// <TokenConfidence> — which parts of generated text you should double-check
// The documented exception to the SVG Chart root:
// THE TEXT IS THE CHART. Confidence maps to three
// discrete tiers as typographic underlines (color + thickness + stroke style —
// never color-alone); confident tokens get NO mark so reading stays primary.
import type { CSSProperties, ReactNode } from "react";
import { devWarn } from "../../core/dev.js";
import {
  EN_TOKEN_CONFIDENCE,
  type TokenConfidenceStrings,
} from "../../core/strings-token-confidence.js";
import {
  DEFAULT_TIERS,
  tokenTierCounts,
  tokenTiers,
  type TieredToken,
  type TokenDatum,
} from "./geometry.js";

export type TokenConfidenceDatum = TokenDatum;

export interface TokenConfidenceProps {
  data: readonly TokenConfidenceDatum[];
  /** The lo/hi thresholds — the ONLY tuning. A gradient prop will never exist. */
  tiers?: readonly [number, number] | undefined;
  /** `"all"` also marks confident tokens (hairline) for audit UIs. */
  show?: "flagged" | "all" | undefined;
  /** Appends the 1-line inline key ("― unsure · ⋯ guessing"). */
  legend?: boolean | undefined;
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
  if (tokens.length === 0) return strings.noTokens;
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
    tiers = DEFAULT_TIERS,
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
  // Decorative only with nothing left to name — a `title` survives the opt-out,
  // the same rule the client entry and shared/a11y.ts apply.
  const aria =
    summary === false && !title
      ? { "aria-hidden": true as const }
      : {
          role: "img" as const,
          "aria-label": [title, accName].filter(Boolean).join(". ") || strings.tokenConfidenceLabel,
        };

  return (
    <span className={rootClass} style={style} id={id} {...aria}>
      {/* SSR hot path (bench floor): no per-token wrapper span — confident
          tokens (the majority) render as bare text nodes, and flagged tokens
          get exactly one underline span instead of an outer+inner pair. */}
      {tokens.flatMap((t, i) => {
        const cls = CLASS[t.tier] ?? (show === "all" ? "mc-tc-seen" : undefined);
        if (!cls) return [t.token];
        // underline the WORD only — keep leading/trailing whitespace outside the
        // marked span so the mark never bleeds under the space between tokens.
        const trimmed = t.token.trimStart();
        const lead = t.token.slice(0, t.token.length - trimmed.length);
        const core = trimmed.trimEnd();
        const trail = trimmed.slice(core.length);
        return [
          lead,
          // eslint-disable-next-line react/no-array-index-key -- tokens repeat; index is the only stable key
          <span key={i} className={cls}>
            {core}
          </span>,
          trail,
        ];
      })}
      {legend ? (
        // The tier NAMES come from the strings bundle (`tokenTierNames`, the same
        // three the announcement and the summary use) — they were spelled out in
        // English here, so a translated `strings` left the key untranslated. Only
        // the two rule glyphs and the separator are literal, and those are
        // typography, not language. Still `aria-hidden`: it maps a MARK to a
        // tier, which is meaningless read aloud, and the tier vocabulary already
        // reaches assistive tech through the accessible name (`tokenConfidence`)
        // and the per-token announcement (`tokenAt`).
        <span className="mc-tc-legend" aria-hidden="true">
          {` ― ${strings.tokenTierNames[1]} · ⋯ ${strings.tokenTierNames[2]}`}
        </span>
      ) : null}
      {children}
    </span>
  );
}
