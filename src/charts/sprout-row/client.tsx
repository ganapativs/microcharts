"use client";
// Interactive <SproutRow>. Roving 1-D keyboard (←/→) + nearest-slot
// pointer lookup; announces each item's stage; a focus ring lifts the active
// glyph. Composes the static component (overlay ring as children).
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { labelFont } from "../../core/labels.js";
import { FILL } from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { sproutRowGeometry } from "./geometry.js";
import { EN_SPROUT, type SproutStrings } from "../../core/strings-sprout.js";
import { SproutRow as StaticSproutRow, sproutRowSummary, type SproutRowProps } from "./index.js";

export interface InteractiveSproutRowProps extends SproutRowProps {
  strings?: SproutStrings;
  /**
   * Opt-in entrance motion (default `false`): each stage glyph settles into
   * place, staggered, when the chart first mounts client-side — echoing the
   * row sprouting in. Inert on the server and on hydrated server HTML;
   * `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function SproutRow(props: InteractiveSproutRowProps): React.ReactNode {
  const {
    strings = EN_SPROUT,
    title,
    data,
    labels = false,
    height = 20,
    step = 16,
    animate = false,
    className,
    style,
    ...rest
  } = props;
  const fontSize = props.fontSize ?? labelFont(height, 0.34);
  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };
  const summary = sproutRowSummary(data, strings);
  const hostRef = useRef<HTMLSpanElement>(null);
  // "rise" from the soil: each stage glyph (data-mc-ink="point") grows upward
  // from its baseline, left→right — the row literally sprouts. "trail" scaled
  // each glyph from its own centre, which read as popping in place, not growing
  // out of the ground.
  useEntrance(hostRef, "rise", animate, {
    selector: '[data-mc-ink="point"]',
    origin: "bottom",
    order: "x",
  });
  const geo = useMemo(
    () =>
      sproutRowGeometry({
        stages: data.map((d) => d.value),
        height,
        step,
        pad: 2,
        bottomReserve: labels ? fontSize + 1 : 0,
      }),
    [data, height, step, labels, fontSize],
  );
  const [active, setActive] = useState<number | null>(null);

  const announce = (i: number | null): string => {
    if (i === null || !data[i]) return "";
    const slot = geo.slots[i]!;
    if (slot.stage === null) return strings.sproutEmpty(data[i]!.label);
    return strings.sproutStage(
      data[i]!.label,
      strings.sproutStageNames[slot.stage]!,
      slot.stage + 1,
    );
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * geo.width;
    const i = Math.floor((x - 2) / step);
    setActive(i >= 0 && i < data.length ? i : null);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      setActive((p) => Math.min(data.length - 1, (p ?? -1) + 1));
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      setActive((p) => Math.max(0, (p ?? data.length) - 1));
      e.preventDefault();
    } else if (e.key === "Escape") setActive(null);
  };

  const label = [title, summary].filter(Boolean).join(". ") || undefined;
  const slot = active !== null ? geo.slots[active] : undefined;

  return (
    <span
      ref={hostRef}
      className={className ? `mc-sprout-live ${className}` : "mc-sprout-live"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticSproutRow
        {...rest}
        data={data}
        labels={labels}
        height={height}
        step={step}
        fontSize={fontSize}
        strings={strings}
        summary={false}
        style={FILL}
      >
        {slot ? (
          <circle
            cx={slot.x}
            cy={slot.baselineY - 5}
            r={7}
            fill="none"
            stroke="var(--mc-accent)"
            data-mc-w="tick"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </StaticSproutRow>
      <LiveRegion>{announce(active)}</LiveRegion>
      {slot ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {announce(active)}
        </span>
      ) : null}
    </span>
  );
}
