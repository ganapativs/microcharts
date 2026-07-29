"use client";
// Interactive <TokenConfidence>. Roving tabIndex across FLAGGED
// tokens (confident tokens are skipped — they carry no mark); focus announces
// the tier + confidence, and hover OR focus floats that same reading as a chip
// over the token (the underline says "flagged"; only the chip says how badly).
// HTML host (the documented SVG exception); shares the pure tiering with
// static entry.
import { useCallback, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { makeFormatter, type Format } from "../../core/format.js";
import { EN_TOKEN_CONFIDENCE } from "../../core/strings-token-confidence.js";
import { LiveRegion } from "../../shared/live-region.js";
import { DEFAULT_TIERS, splitToken, tokenTiers, type Tier } from "./geometry.js";
import { tokenConfidenceSummary, type TokenConfidenceProps } from "./index.js";

const CLASS: Record<Tier, string | undefined> = {
  confident: undefined,
  unsure: "mc-tc-unsure",
  guessing: "mc-tc-guessing",
};
const TIER_INDEX: Record<Tier, 0 | 1 | 2> = { confident: 0, unsure: 1, guessing: 2 };
export interface InteractiveTokenConfidenceProps extends TokenConfidenceProps {
  /**
   * Number format/locale for the focus announcement's confidence reading.
   * Interactive-only: the static entry renders the text and its underlines,
   * never a number.
   */
  format?: Format;
  locale?: string | string[];
  /**
   * Show the floating tier + confidence chip on hover/focus (default `true`).
   * `false` suppresses only the chip; the announcement is untouched.
   */
  readout?: boolean;
}

export function TokenConfidence(props: InteractiveTokenConfidenceProps): React.ReactNode {
  const {
    data,
    tiers = DEFAULT_TIERS,
    show = "flagged",
    legend = false,
    readout = true,
    format,
    locale,
    strings = EN_TOKEN_CONFIDENCE,
    title,
    summary,
    className,
    style,
    children,
  } = props;

  const tokens = useMemo(() => tokenTiers({ data, tiers }), [data, tiers]);
  const flagged = useMemo(
    () => tokens.map((t, i) => (t.tier !== "confident" ? i : -1)).filter((i) => i >= 0),
    [tokens],
  );
  // token index → its position in `flagged` (a plain `indexOf` inside the token
  // render loop below is quadratic on a long streamed reply, and that loop runs
  // again on every arrow key).
  const flaggedPosOf = useMemo(() => {
    const m = new Map<number, number>();
    flagged.forEach((t, pos) => m.set(t, pos));
    return m;
  }, [flagged]);
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // A non-finite confidence already reads as `guessing` — the READING has to
  // agree. `fmt(NaN)` announced "52: guessing, NaN." and painted "guessing NaN"
  // in the chip while the underline was correct. Em-dash rather than a strings
  // token for the same reason Delta uses one: it is typography, not language.
  const conf = useCallback((c: number): string => (Number.isFinite(c) ? fmt(c) : "—"), [fmt]);
  const hostRef = useRef<HTMLSpanElement>(null);
  // Tokens are addressed through one data attribute, not an array of ref
  // callbacks: an inline `ref={(el) => …}` has a fresh identity every render, so
  // React detached and re-attached EVERY token ref on every render — and a
  // streamed reply re-renders once per token. Same for the listeners below.
  const tokenEl = useCallback(
    (i: number): HTMLElement | null =>
      hostRef.current?.querySelector<HTMLElement>(`[data-mc-token="${i}"]`) ?? null,
    [],
  );
  const [active, setActive] = useState<number | null>(null);
  const [announced, setAnnounced] = useState("");
  // The chip carries its own position: the host is a paragraph of flowing,
  // wrapping text, so "above the chart" is meaningless — the chip has to sit
  // over the token itself, which means measuring it. A client entry may
  // measure; the static one may not.
  const [chip, setChip] = useState<{ text: string; left: number; top: number } | null>(null);
  const baseId = useId();

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : tokenConfidenceSummary(tokens, strings);
  // Decorative opt-out, the same rule `named()` applies to every other chart:
  // `summary={false}` with no `title` means the text is already in the page and
  // the marks are ornament. The static entry honoured it; this one named itself
  // unconditionally AND kept its roving tab stops, so assistive tech landed on
  // an image it had nothing to say about (WCAG 4.1.2). Tab stops go with it —
  // focusable descendants of `aria-hidden` are exactly the state that rule bans.
  const decorative = summary === false && !title;
  const label = [title, accName].filter(Boolean).join(". ") || strings.tokenConfidenceLabel;

  const announce = useCallback(
    (tokenIndex: number) => {
      const t = tokens[tokenIndex]!;
      setAnnounced(
        strings.tokenAt(
          t.token.trim() || t.token,
          strings.tokenTierNames[TIER_INDEX[t.tier]],
          conf(t.confidence),
        ),
      );
    },
    [tokens, strings, conf],
  );

  const showChip = useCallback(
    (tokenIndex: number) => {
      const host = hostRef.current;
      const el = tokenEl(tokenIndex);
      const t = tokens[tokenIndex];
      if (!readout || !host || !el || !t) return;
      const h = host.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      setChip({
        text: strings.tokenChip(strings.tokenTierNames[TIER_INDEX[t.tier]]!, conf(t.confidence)),
        left: r.left - h.left + r.width / 2,
        top: r.top - h.top,
      });
    },
    [readout, tokens, strings, conf, tokenEl],
  );

  const focusFlagged = useCallback(
    (fi: number) => {
      const clamped = Math.max(0, Math.min(flagged.length - 1, fi));
      setActive(clamped);
      tokenEl(flagged[clamped]!)?.focus();
      announce(flagged[clamped]!);
      showChip(flagged[clamped]!);
    },
    [flagged, announce, showChip, tokenEl],
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

  // ONE listener set on the host instead of three per flagged token. React's
  // onFocus/onBlur are focusin/focusout (they bubble), and pointerover bubbles
  // where pointerenter does not — so delegation is a straight swap, and a
  // 500-token reply stops paying 1 500 handler bindings per render.
  const tokenIndexFrom = (target: EventTarget | null): number | null => {
    const el = (target as Element | null)?.closest?.("[data-mc-token]");
    const raw = el?.getAttribute("data-mc-token");
    return raw === null || raw === undefined ? null : Number(raw);
  };

  return (
    <span
      className={rootClass}
      style={style as CSSProperties}
      ref={hostRef}
      {...(decorative ? { "aria-hidden": true as const } : { role: "img", "aria-label": label })}
      onKeyDown={decorative ? undefined : onKeyDown}
      onPointerOver={
        decorative
          ? undefined
          : (e) => {
              const i = tokenIndexFrom(e.target);
              // Clearing on the way OUT of a token matters as much as showing:
              // the host is a paragraph, so the pointer leaves a flagged token
              // onto ordinary prose long before it leaves the host, and a chip
              // that only cleared on `pointerleave` hung over unrelated words.
              if (i !== null && flaggedPosOf.has(i)) showChip(i);
              else setChip(null);
            }
      }
      onPointerLeave={() => setChip(null)}
      onFocus={
        decorative
          ? undefined
          : (e) => {
              const i = tokenIndexFrom(e.target);
              const pos = i === null ? undefined : flaggedPosOf.get(i);
              if (i === null || pos === undefined) return;
              setActive(pos);
              announce(i);
              showChip(i);
            }
      }
      onBlur={() => setChip(null)}
    >
      {/* One span per MARKED token, and none at all for the rest — the same
          hot-path shape the static entry ships. A confident token used to get an
          outer wrapper span carrying nothing, and a flagged one got an
          outer+inner pair; a 500-token streamed reply paid ~500 dead nodes.
          Merging the pair also puts the tab stop on the underlined word itself,
          which is what styles.css targets — `.mc-tc-live .mc-tc-*:focus-visible`
          never matched the old outer span, so the accent focus ring never
          appeared — and it centers the chip on the word rather than on the word
          plus its trailing space. */}
      {tokens.flatMap((t, i) => {
        const cls = CLASS[t.tier] ?? (show === "all" ? "mc-tc-seen" : undefined);
        if (!cls) return [t.token];
        const flaggedPos = flaggedPosOf.get(i);
        const focusable = flaggedPos !== undefined && !decorative;
        const [lead, core, trail] = splitToken(t.token);
        return [
          lead,
          <span
            // eslint-disable-next-line react/no-array-index-key -- tokens repeat; index is the only stable key
            key={i}
            className={cls}
            data-mc-token={flaggedPos === undefined ? undefined : i}
            id={focusable ? `${baseId}-${i}` : undefined}
            tabIndex={
              focusable
                ? active === flaggedPos || (active === null && flaggedPos === 0)
                  ? 0
                  : -1
                : undefined
            }
          >
            {core}
          </span>,
          trail,
        ];
      })}
      {legend ? (
        // Tier names from the strings bundle, same as the static entry — see the
        // note there for why the glyphs stay literal and the key stays
        // `aria-hidden`.
        <span className="mc-tc-legend" aria-hidden="true">
          {` ― ${strings.tokenTierNames[1]} · ⋯ ${strings.tokenTierNames[2]}`}
        </span>
      ) : null}
      {children}
      <LiveRegion>{announced}</LiveRegion>
      {readout && chip ? (
        <span
          className="mc-spark-readout"
          style={{
            left: chip.left,
            top: chip.top,
            bottom: "auto",
            transform: "translate(-50%, calc(-100% - 0.2em))",
          }}
        >
          {chip.text}
        </span>
      ) : null}
    </span>
  );
}
