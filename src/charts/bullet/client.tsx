"use client";
// Interactive <Bullet> (plan/04 §4, plan/08 T2). The static measure/target/bands
// visual, wrapped focusable, with a readout of the exact value vs target revealed
// on hover or focus. The wrapper owns the accessible name (role=img); the inner
// static chart is decorative so the reading isn't announced twice.
import { useState, type CSSProperties } from "react";
import { Bullet as StaticBullet, type BulletProps } from "./index.js";

export function Bullet(props: BulletProps): React.ReactNode {
  const { value, target, format, locale, title, summary, className, style } = props;
  const [open, setOpen] = useState(false);

  const fmt =
    typeof format === "function"
      ? format
      : (n: number) => new Intl.NumberFormat(locale, format).format(n);

  const auto = target === undefined ? `${fmt(value)}.` : `${fmt(value)} of ${fmt(target)} target.`;
  const accName = summary === false ? undefined : typeof summary === "string" ? summary : auto;
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const readout =
    target === undefined
      ? fmt(value)
      : `${fmt(value)} / ${fmt(target)}${
          Number.isFinite(value - target)
            ? ` · ${value - target >= 0 ? "+" : "−"}${fmt(Math.abs(value - target))}`
            : ""
        }`;

  const wrapStyle: CSSProperties = {
    display: "inline-block",
    position: "relative",
    lineHeight: 0,
    ...style,
  };

  return (
    <span
      className={className ? `mc-bullet-interactive ${className}` : "mc-bullet-interactive"}
      style={wrapStyle}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <StaticBullet {...props} summary={false} />
      {open ? (
        <span
          className="mc-spark-readout"
          style={{
            position: "absolute",
            right: 0,
            bottom: "100%",
            font: "var(--mc-label-size, 0.75em) var(--mc-font, inherit)",
            fontVariantNumeric: "tabular-nums",
            color: "var(--mc-accent)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {readout}
        </span>
      ) : null}
    </span>
  );
}
