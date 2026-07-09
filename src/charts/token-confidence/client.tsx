"use client";
// Interactive <TokenConfidence> (plan/25 §7). Roving tabIndex across FLAGGED
// tokens (confident tokens are skipped — they carry no mark); focus announces
// the tier + confidence. HTML host (the documented SVG exception); shares the
// pure tiering with the static entry.
import { useCallback, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_TOKEN_CONFIDENCE } from "../../core/strings-token-confidence.js";
import { tokenTiers, type Tier } from "./geometry.js";
import { tokenConfidenceSummary, type TokenConfidenceProps } from "./index.js";

const CLASS: Record<Tier, string | undefined> = {
  confident: undefined,
  unsure: "mc-tc-unsure",
  guessing: "mc-tc-guessing",
};
const TIER_INDEX: Record<Tier, 0 | 1 | 2> = { confident: 0, unsure: 1, guessing: 2 };

export function TokenConfidence(props: TokenConfidenceProps): React.ReactNode {
  const {
    data,
    tiers = [0.5, 0.8],
    show = "flagged",
    legend = false,
    format,
    locale,
    strings = EN_TOKEN_CONFIDENCE,
    title,
    summary,
    className,
    style,
  } = props;

  const tokens = useMemo(() => tokenTiers({ data, tiers }), [data, tiers]);
  const flagged = useMemo(
    () => tokens.map((t, i) => (t.tier !== "confident" ? i : -1)).filter((i) => i >= 0),
    [tokens],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [announced, setAnnounced] = useState("");
  const baseId = useId();

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : tokenConfidenceSummary(tokens, strings);
  const label = [title, accName].filter(Boolean).join(". ") || "Token confidence";

  const announce = useCallback(
    (tokenIndex: number) => {
      const t = tokens[tokenIndex]!;
      setAnnounced(
        strings.tokenAt(
          t.token.trim() || t.token,
          strings.tokenTierNames[TIER_INDEX[t.tier]],
          fmt(t.confidence),
        ),
      );
    },
    [tokens, strings, fmt],
  );

  const focusFlagged = useCallback(
    (fi: number) => {
      const clamped = Math.max(0, Math.min(flagged.length - 1, fi));
      setActive(clamped);
      refs.current[flagged[clamped]!]?.focus();
      announce(flagged[clamped]!);
    },
    [flagged, announce],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (flagged.length === 0) return;
      const cur = active ?? 0;
      switch (e.key) {
        case "ArrowRight":
          focusFlagged(cur + 1);
          break;
        case "ArrowLeft":
          focusFlagged(cur - 1);
          break;
        case "Home":
          focusFlagged(0);
          break;
        case "End":
          focusFlagged(flagged.length - 1);
          break;
        default:
          return;
      }
      e.preventDefault();
    },
    [active, flagged, focusFlagged],
  );

  const rootClass = className
    ? `mc-token-confidence mc-tc-live ${className}`
    : "mc-token-confidence mc-tc-live";

  return (
    <span
      className={rootClass}
      style={style as CSSProperties}
      role="img"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {tokens.map((t, i) => {
        const flaggedPos = flagged.indexOf(i);
        const isFlagged = flaggedPos >= 0;
        const cls = CLASS[t.tier] ?? (show === "all" ? "mc-tc-seen" : undefined);
        return (
          <span
            // eslint-disable-next-line react/no-array-index-key -- tokens repeat; index is the only stable key
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={cls}
            id={isFlagged ? `${baseId}-${i}` : undefined}
            tabIndex={
              isFlagged
                ? active === flaggedPos || (active === null && flaggedPos === 0)
                  ? 0
                  : -1
                : undefined
            }
            onFocus={
              isFlagged
                ? () => {
                    setActive(flaggedPos);
                    announce(i);
                  }
                : undefined
            }
          >
            {t.token}
          </span>
        );
      })}
      {legend ? (
        <span className="mc-tc-legend" aria-hidden="true">
          {" ― unsure · ⋯ guessing"}
        </span>
      ) : null}
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
    </span>
  );
}
