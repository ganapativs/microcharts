"use client";
// Interactive <FillWord>. The ink edge glides along the word via a
// CSS clip-path transition (styles.css, reduced-motion-gated). Announces changes
// through a polite region, throttled to ≥1 s so a streaming value never spams.
// Wrapper focus only (one value). Composes the static component.
import { useEffect, useRef, useState } from "react";
import { FILL, wrap } from "../../shared/interactive.js";
import type { MicroDatum } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_FILL_WORD, type FillWordStrings } from "../../core/strings-fill-word.js";
import { FillWord as StaticFillWord, fillWordSummary, type FillWordProps } from "./index.js";

export interface InteractiveFillWordProps extends FillWordProps {
  /** Announce changes through a polite region (default true). */
  live?: boolean;
  strings?: FillWordStrings;
  /**
   * Opt-in entrance motion (default `false`): the word wipes in left-to-right
   * when the chart first mounts client-side — matching the fill encoding.
   * Inert on the server and on hydrated server HTML; `prefers-reduced-motion`
   * always wins.
   */
  animate?: boolean;
  /** The word was activated (click, tap, Enter or Space): `{ index: 0, value, label }` — the clamped fill fraction, named by the word. */
  onSelect?: ((datum: MicroDatum | null) => void) | undefined;
}

export function FillWord(props: InteractiveFillWordProps): React.ReactNode {
  const {
    live = true,
    strings = EN_FILL_WORD,
    animate = false,
    title,
    value,
    word,
    mode = "fill",
    onSelect,
    className,
    style,
    ...rest
  } = props;
  const hostRef = useRef<HTMLSpanElement>(null);
  // "wipe" clips the whole <svg> left-to-right — the word fills left-to-right,
  // so the entrance now matches the encoding instead of a plain fade. This
  // targets the <svg> element's own clip-path; the live value transition
  // (styles.css) clips only the inner accent <text> to its value fraction —
  // different elements, different properties, so the two never fight: the
  // svg-level reveal plays once on mount, then the text-level clip keeps
  // tracking `value` independently afterward.
  useEntrance(hostRef, "wipe", animate);
  const summary = fillWordSummary(value, word, mode, strings);
  const prev = useRef(value);
  const last = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [announced, setAnnounced] = useState("");

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (!live) return;
    const emit = () => {
      last.current = performance.now();
      setAnnounced(summary);
    };
    const since = performance.now() - last.current;
    if (since >= 1000) emit();
    else {
      clearTimeout(timer.current);
      timer.current = setTimeout(emit, 1000 - since);
    }
    return () => clearTimeout(timer.current);
  }, [value, summary, live]);

  const label = [title, summary].filter(Boolean).join(". ") || undefined;

  // Drill-down: the clamped fraction the ink clips to, named by the word itself.
  const select = (): void =>
    onSelect?.({
      index: 0,
      value: Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null,
      label: word,
    });

  return (
    <span
      ref={hostRef}
      {...wrap("mc-fillword-live", className, style)}
      tabIndex={0}
      role="img"
      aria-label={label}
      onClick={select}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      }}
    >
      <StaticFillWord
        {...rest}
        style={FILL}
        word={word}
        value={value}
        mode={mode}
        strings={strings}
        summary={false}
      />
      {live ? <LiveRegion>{announced}</LiveRegion> : null}
    </span>
  );
}
