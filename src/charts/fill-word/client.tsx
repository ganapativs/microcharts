"use client";
// Interactive <FillWord>. The ink edge glides along the word via a
// CSS clip-path transition (styles.css, reduced-motion-gated). Announces changes
// through a polite region, throttled to ≥1 s so a streaming value never spams.
// Wrapper focus only (one value) — but hover/focus reveals the percent, which
// the fill edge alone only approximates.
import { useEffect, useRef, useState } from "react";
import { CHIP, named, fillFor, wrap } from "../../shared/interactive.js";
import type { MicroDatum } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { EN_FILL_WORD, type FillWordStrings } from "../../core/strings-fill-word.js";
import {
  FillWord as StaticFillWord,
  fillWordSummary,
  shownPctText,
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
  /**
   * The active (hovered / keyboard-focused) unit changed. One word = one unit, so
   * this fires once with `{ index: 0, … }` on pointer enter or focus and once
   * with `null` when that clears — never repeatedly while the pointer moves
   * inside the word, and never twice when hover and focus overlap.
   */
  onActive?: ((datum: MicroDatum | null) => void) | undefined;
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
    locale,
    readout = true,
    onActive,
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
  const text = fillWordSummary(value, word, mode, strings, locale);
  const prev = useRef(value);
  // -Infinity, not 0: `performance.now()` counts from THIS document's time
  // origin, so 0 reads as "announced at page load" and defers the leading edge
  // by up to a full second for any change in the page's first second — the
  // exact window a chart streamed into a reply lands in. -Infinity means "never
  // announced", so the first change emits at once and only repeats throttle.
  const last = useRef(-Infinity);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [announced, setAnnounced] = useState("");
  const [hover, setHover] = useState(false);
  // The same numeral `label="value"` prints — one source, so hover and label
  // can never disagree about the reading.
  const readoutText = shownPctText(value, mode, locale);

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

  // Clamped fill fraction (word label). One datum builder — callbacks match the chip.
  const datum = (): MicroDatum => ({
    index: 0,
    value: Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null,
    label: word,
    formatted: readoutText,
  });
  const select = (): void => onSelect?.(datum());
  // ONE unit: `onActive` fires on the enter/leave EDGE only. `hover` alone can't
  // gate it — pointer-enter then focus both set it `true`, which would announce
  // the same unit twice — so the last emitted state is tracked here.
  const shown = useRef(false);
  const activate = (on: boolean): void => {
    setHover(on);
    if (shown.current === on) return;
    shown.current = on;
    onActive?.(on ? datum() : null);
  };

  return (
    <span
      ref={hostRef}
      {...wrap("mc-fillword-live", className, style)}
      {...named(label)}
      onPointerEnter={() => activate(true)}
      onPointerLeave={() => activate(false)}
      onFocus={() => activate(true)}
      onBlur={() => activate(false)}
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
        locale={locale}
        strings={strings}
        summary={false}
      />
      <LiveRegion>{live && props.summary !== false ? announced : ""}</LiveRegion>
      {/* The word's ink edge is a rough gauge; the percent behind it is
          invisible unless `label="value"` prints it. */}
      {readout && hover && props.label !== "value" ? (
        <span className="mc-spark-readout" {...CHIP}>
          {readoutText}
        </span>
      ) : null}
    </span>
  );
}
