"use client";
// Interactive <StarSpoke> (plan/25 §9). One pointer listener; nearest spoke by
// angle. ←/→ rotate focus through the spokes. Composes the static component.
import { useCallback, useMemo, useState, type PointerEvent } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_STAR_SPOKE } from "../../core/strings-star-spoke.js";
import { starSpokeGeometry } from "./geometry.js";
import { StarSpoke as StaticStarSpoke, starSpokeSummary, type StarSpokeProps } from "./index.js";

export function StarSpoke(props: StarSpokeProps): React.ReactNode {
  const {
    data,
    domain = [0, 1],
    size = 32,
    labels = false,
    format,
    locale,
    strings = EN_STAR_SPOKE,
    title,
    summary,
    ...rest
  } = props;

  const pad = labels && size >= 48 ? Math.max(10, size * 0.2) : 2;
  const geo = useMemo(
    () =>
      starSpokeGeometry({
        values: data.map((d) => d.value),
        domain,
        width: size,
        height: size,
        pad,
      }),
    [data, domain, size, pad],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const n = data.length;
  const [active, setActive] = useState<number | null>(null);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : starSpokeSummary(data, strings, fmt);
  const label = [title, accName].filter(Boolean).join(". ") || undefined;

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (n === 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (r.width === 0) return;
      const px = ((e.clientX - r.left) / r.width) * size - size / 2;
      const py = ((e.clientY - r.top) / r.height) * size - size / 2;
      if (Math.hypot(px, py) < size * 0.06) {
        setActive(null);
        return;
      }
      const a = Math.atan2(py, px); // screen angle
      let i = Math.round((a + Math.PI / 2) / ((2 * Math.PI) / n)) % n;
      if (i < 0) i += n;
      setActive(i);
    },
    [n, size],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (n === 0) return;
      setActive((prev) => {
        const cur = prev ?? 0;
        switch (e.key) {
          case "ArrowRight":
          case "ArrowDown":
            e.preventDefault();
            return (cur + 1) % n;
          case "ArrowLeft":
          case "ArrowUp":
            e.preventDefault();
            return (cur - 1 + n) % n;
          case "Escape":
            return null;
          default:
            return prev;
        }
      });
    },
    [n],
  );

  const spoke = active != null ? geo.spokes[active] : undefined;
  const datum = active != null ? data[active] : undefined;
  const announced = datum ? strings.spokeAt(datum.label, fmt(datum.value)) : "";

  return (
    <span
      className="mc-star-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticStarSpoke
        {...rest}
        data={data}
        domain={domain}
        size={size}
        labels={labels}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      >
        {spoke ? (
          <line
            x1={spoke.x1}
            y1={spoke.y1}
            x2={spoke.x2}
            y2={spoke.y2}
            stroke="var(--mc-accent)"
            strokeLinecap="round"
            data-mc-w="support"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {spoke ? (
          <circle
            cx={spoke.tx}
            cy={spoke.ty}
            r={Math.max(1, size * 0.05)}
            fill="var(--mc-accent)"
          />
        ) : null}
        {rest.children}
      </StaticStarSpoke>
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
      {spoke && datum ? (
        <span
          className="mc-spark-readout"
          style={{
            left: `${(spoke.tx / size) * 100}%`,
            top: `${(spoke.ty / size) * 100}%`,
            transform: "translate(-50%, -140%)",
            bottom: "auto",
          }}
        >
          {`${datum.label} ${fmt(datum.value)}`}
        </span>
      ) : null}
    </span>
  );
}
