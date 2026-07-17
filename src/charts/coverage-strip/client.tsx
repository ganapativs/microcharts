"use client";
// Interactive <CoverageStrip>. One pointer listener on the wrapper
// + pure grid lookup (x → slot by division) — never a node per cell. ←/→ steps
// slots, Home/End jump. The live region says exactly what each slot is: a
// measured value, or "no measurement" (the honest distinction). Composes the
// static component (canon); the focus ring is an overlay child re-using the
// same geometry.
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { makeFormatter } from "../../core/format.js";
import { FILL } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { EN_COVERAGE, type CoverageStrings } from "../../core/strings-coverage.js";
import { coverageGeometry } from "./geometry.js";
import { CoverageStrip as StaticCoverageStrip, type CoverageStripProps } from "./index.js";

export interface InteractiveCoverageStripProps extends CoverageStripProps {
  strings?: CoverageStrings;
  /**
   * Opt-in entrance motion (default `false`): the strip wipes in left to right
   * on first client-side mount — a time-forward reveal for the 1×N slots (an
   * index cascade over so many cells collapses under the stagger cap into a
   * near-simultaneous fade). Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function CoverageStrip(props: InteractiveCoverageStripProps): React.ReactNode {
  const {
    data,
    expected,
    mode = "binary",
    steps = 5,
    domain,
    shape = "square",
    label = "none",
    width = 80,
    height = 10,
    format,
    locale,
    strings = EN_COVERAGE,
    title,
    summary,
    animate = false,
    className,
    style,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  // Time runs along x: each slot lights up in turn, oldest→newest. An explicit
  // `order:"x"` + `window` spreads the cascade across the whole strip (it does
  // NOT collapse under the default stagger cap), so the reveal reads as time
  // advancing cell by cell; past `maxMarks` a dense strip still falls to wipe.
  useEntrance(hostRef, "reveal", animate, {
    selector: 'rect[data-mc-ink="cell"], rect[data-mc-ink="gap"]',
    order: "x",
    window: 400,
  });

  // must match the static entry's font formula — the label gutter widens
  // totalWidth, and a mismatched fontSize would drift the readout off-cell
  const font = Math.min(11, Math.max(7, Math.round(height * 0.62)));
  const geo = useMemo(
    () =>
      coverageGeometry({
        width,
        height,
        data,
        expected,
        mode,
        steps,
        domain,
        shape,
        gutterCh: label === "percent" ? 4 : 0,
        fontSize: font,
      }),
    [width, height, data, expected, mode, steps, domain, shape, label, font],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const pctFmt = useMemo(
    () => makeFormatter({ style: "percent", maximumFractionDigits: 0 }, locale),
    [locale],
  );
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo.expected === 0
          ? strings.noData
          : strings.coverage(geo.measured, geo.expected, pctFmt(geo.coverage), geo.longestGap);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (geo.pitch === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const x = ((e.clientX - r.left) / r.width) * geo.totalWidth;
      const i = Math.min(geo.cells.length - 1, Math.max(0, Math.floor(x / geo.pitch)));
      setActive(i);
    },
    [geo],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (geo.cells.length === 0) return;
      if (!["ArrowRight", "ArrowLeft", "Home", "End", "Escape"].includes(e.key)) return;
      e.preventDefault();
      if (e.key === "Escape") {
        setActive(null);
        return;
      }
      const max = geo.cells.length - 1;
      // functional update — rapid key presses compose without a stale closure
      setActive((prev) => {
        const pos = prev ?? -1;
        switch (e.key) {
          case "ArrowRight":
            return Math.min(max, pos + 1);
          case "ArrowLeft":
            return pos <= 0 ? 0 : pos - 1;
          case "Home":
            return 0;
          case "End":
            return max;
          default:
            return prev;
        }
      });
    },
    [geo],
  );

  const cell = active !== null ? geo.cells[active] : undefined;
  let announced = "";
  if (cell) {
    announced = !cell.present
      ? strings.coverageSlot(active! + 1, null)
      : strings.coverageSlot(active! + 1, cell.value === null ? "—" : fmt(cell.value));
  }

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      ref={hostRef}
      className={className ? `mc-coverage-strip-live ${className}` : "mc-coverage-strip-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticCoverageStrip
        {...rest}
        style={FILL}
        data={data}
        expected={expected}
        mode={mode}
        steps={steps}
        domain={domain}
        shape={shape}
        label={label}
        width={width}
        height={height}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {cell ? (
          <rect
            x={cell.x - 0.75}
            y={cell.y - 0.75}
            width={cell.w + 1.5}
            height={cell.h + 1.5}
            rx={cell.rx + 0.75}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticCoverageStrip>
      {cell ? (
        <span
          className="mc-coverage-readout mc-spark-readout"
          style={{
            left: `${((cell.x + cell.w / 2) / geo.totalWidth) * 100}%`,
            transform: "translateX(-50%)",
          }}
        >
          {/* no hardcoded English in the chip (i18n canon): non-values show a
              dash; the live region carries the localized full sentence */}
          {cell.present && cell.value !== null ? fmt(cell.value) : "—"}
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
