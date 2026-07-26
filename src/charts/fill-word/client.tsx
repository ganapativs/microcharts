"use client";
// Interactive <FillWord>. The ink edge glides along the word via a
// CSS clip-path transition (styles.css, reduced-motion-gated). Announces changes
// through a polite region, throttled to ≥1 s so a streaming value never spams.
// Wrapper focus only (one value) — but hover/focus reveals the percent, which
// the fill edge alone only approximates. Composes the static component.
import { useEffect, useRef, useState } from "react";
import { named, fillFor, wrap } from "../../shared/interactive.js";
import type { MicroDatum } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_FILL_WORD, type FillWordStrings } from "../../core/strings-fill-word.js";
import {
  FillWord as StaticFillWord,
  fillWordSummary,
  shownPct,
  type FillWordProps,
} from "./index.js";

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
  /**
   * Show the floating percent chip on hover/focus (default `true`). `false`
   * suppresses only the chip. Inert when `label="value"` already prints it.
   */
  readout?: boolean;
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
    readout = true,
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
  const text = fillWordSummary(value, word, mode, strings);
  const prev = useRef(value);
  const last = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [announced, setAnnounced] = useState("");
  const [hover, setHover] = useState(false);
  // The same numeral `label="value"` prints — one source, so hover and label
  // can never disagree about the reading.
  const readoutText = `${shownPct(value, mode)}%`;

  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    if (!live) return;
    const emit = () => {
      last.current = performance.now();
      setAnnounced(text);
    };
    const since = performance.now() - last.current;
    if (since >= 1000) emit();
    else {
      clearTimeout(timer.current);
      timer.current = setTimeout(emit, 1000 - since);
    }
    return () => clearTimeout(timer.current);
  }, [value, text, live]);

  // The caller's `summary` owns the wrapper's name: `false` is the decorative
  // opt-out (`named()` renders `aria-hidden` and drops the tab stop with it), a
  // string replaces the generated sentence. The generated text stays what the
  // live region announces on a value change.
  const accName =
    props.summary === false ? undefined : typeof props.summary === "string" ? props.summary : text;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  // Drill-down: the clamped fraction the ink clips to, named by the word itself.
  const select = (): void =>
    onSelect?.({
      index: 0,
      value: Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null,
      label: word,
      formatted: readoutText,
    });

  return (
    <span
      ref={hostRef}
      {...wrap("mc-fillword-live", className, style)}
      {...named(label)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
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
        style={fillFor(style)}
        word={word}
        value={value}
        mode={mode}
        strings={strings}
        summary={false}
      />
      <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
      {/* The word's ink edge is a rough gauge; the percent behind it is
          invisible unless `label="value"` prints it. */}
      {readout && hover && props.label !== "value" ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {readoutText}
        </span>
      ) : null}
    </span>
  );
}
