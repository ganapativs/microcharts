"use client";
// Interactive <BalanceBeam>. Hover a side (nearest-half) or arrow
// Left/Right to focus it → readout shows its label + value; the beam eases to a
// new tilt on data change (CSS geometry transition, reduced-motion-gated);
// announces when the heavier side flips. Composes the static component.
import { useEffect, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { balanceBeamGeometry } from "./geometry.js";
import { EN_BEAM, type BeamStrings } from "../../core/strings-beam.js";
import { BalanceBeam as StaticBeam, balanceBeamSummary, type BalanceBeamProps } from "./index.js";

export interface InteractiveBalanceBeamProps extends BalanceBeamProps {
  live?: boolean;
  strings?: BeamStrings;
  /**
   * Opt-in entrance motion (default `false`): the two weights settle onto
   * the beam on first client-side mount. Inert on the server and on hydrated
   * server HTML; `prefers-reduced-motion` always wins. Independent of the
   * beam's own live-retilt CSS transition (that eases geometry attributes on
   * data change; this animates transform/opacity on mount — no overlap).
   */
  animate?: boolean;
}

export function BalanceBeam(props: InteractiveBalanceBeamProps): React.ReactNode {
  const {
    live = true,
    strings = EN_BEAM,
    title,
    data,
    mode = "ratio",
    domain,
    maxTilt = 12,
    format,
    locale,
    animate = false,
    ...rest
  } = props;
  const summary = balanceBeamSummary(data, { mode, domain, strings, format, locale });
  const [active, setActive] = useState<0 | 1 | null>(null);
  const [announced, setAnnounced] = useState("");
  const hostRef = useRef<HTMLSpanElement>(null);
  // Only the weights (dots) settle — the beam and fulcrum arrive via the base
  // whole-svg fade, since a scaling line/path would read oddly at this scale.
  useEntrance(hostRef, "settle", animate, {
    selector: '[data-mc-ink="accent"], [data-mc-ink="point"]',
  });
  const prevHeavier = useRef(
    balanceBeamGeometry({
      a: data[0].value,
      b: data[1].value,
      width: 48,
      height: 20,
      maxTilt,
      mode,
      domain,
      pad: 2,
    }).heavier,
  );

  useEffect(() => {
    const h = balanceBeamGeometry({
      a: data[0].value,
      b: data[1].value,
      width: 48,
      height: 20,
      maxTilt,
      mode,
      domain,
      pad: 2,
    }).heavier;
    if (h === prevHeavier.current) return;
    prevHeavier.current = h;
    if (live) setAnnounced(summary);
  }, [data, mode, domain, maxTilt, summary, live]);

  const label = [title, summary].filter(Boolean).join(". ") || undefined;
  const fmt = makeFormatter(format, locale);

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    setActive((e.clientX - rect.left) / rect.width < 0.5 ? 0 : 1);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setActive(0);
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      setActive(1);
      e.preventDefault();
    } else if (e.key === "Escape") setActive(null);
  };

  const datum = active !== null ? data[active] : undefined;

  return (
    <span
      ref={hostRef}
      className="mc-beam-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      <StaticBeam
        {...rest}
        data={data}
        mode={mode}
        domain={domain}
        maxTilt={maxTilt}
        format={format}
        locale={locale}
        strings={strings}
        summary={false}
      />
      {live ? <LiveRegion>{announced}</LiveRegion> : null}
      {datum ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {`${datum.label} ${fmt(datum.value)}`}
        </span>
      ) : null}
    </span>
  );
}
