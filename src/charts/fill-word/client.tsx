"use client";
// Interactive <FillWord> (plan/24 #3). The ink edge glides along the word via a
// CSS clip-path transition (styles.css, reduced-motion-gated). Announces changes
// through a polite region, throttled to ≥1 s so a streaming value never spams.
// Wrapper focus only (one value). Composes the static component.
import { useEffect, useRef, useState } from "react";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_FILL_WORD, type FillWordStrings } from "../../core/strings-fill-word.js";
import { FillWord as StaticFillWord, fillWordSummary, type FillWordProps } from "./index.js";

export interface InteractiveFillWordProps extends FillWordProps {
  /** Announce changes through a polite region (default true). */
  live?: boolean;
  strings?: FillWordStrings;
  /**
   * Opt-in entrance motion (default `false`): the word fades in when the
   * chart first mounts client-side. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
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
    ...rest
  } = props;
  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "fade", animate);
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

  return (
    <span
      ref={hostRef}
      className="mc-fillword-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
    >
      <StaticFillWord
        {...rest}
        word={word}
        value={value}
        mode={mode}
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
