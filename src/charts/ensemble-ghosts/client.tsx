"use client";
// Interactive <EnsembleGhosts> — the HOP loop. On hover/focus, cycle members
// one at a time at full opacity (~400 ms/frame ≈ 2.5 Hz, the studied
// Hypothetical-Outcome-Plots cadence), looping until the pointer leaves.
// Reduced-motion: NO loop — ←/→ step members discretely (same information, no
// motion). A readout chip names the active/hopped member's endpoint so the
// cycle is readable frame by frame. The live region announces only on a
// keyboard step or when the loop stops — never per frame. Composes the static
// component (canon).
//
// useActivePicker owns the DISCRETE side of the interaction (roving keyboard,
// tap/click selection, the onActive/onSelect contract); the ambient loop stays
// bespoke, so `bind.onPointerMove` is deliberately NOT spread — pointer POSITION
// carries no meaning over a bundle of overlapping strands, hovering the chart
// plays the loop instead. Everything else in `bind` is wired.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { isFiniteValue } from "../../core/types.js";
import {
  named,
  fillFor,
  useActivePicker,
  wrap,
  type PickerProps,
} from "../../shared/interactive.js";
import { useEntrance } from "../../shared/motion-gate.js";
import { LiveRegion } from "../../shared/live-region.js";
import { usePrefersReducedMotion } from "../../shared/motion.js";
import { EN_ENSEMBLE, type EnsembleStrings } from "../../core/strings-ensemble.js";
import { ensembleGeometry } from "./geometry.js";
import {
  EnsembleGhosts as StaticEnsembleGhosts,
  ensembleSummary,
  type EnsembleGhostsProps,
} from "./index.js";

const Static = memo(StaticEnsembleGhosts);
const SVG_NS = "http://www.w3.org/2000/svg";

function hopGroup(svg: SVGSVGElement): SVGGElement {
  let g = svg.querySelector("g[data-mc-hop]") as SVGGElement | null;
  if (!g) {
    g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("data-mc-hop", "");
    svg.appendChild(g);
  }
  return g;
}

export interface InteractiveEnsembleGhostsProps extends EnsembleGhostsProps, PickerProps {
  strings?: EnsembleStrings;
  /**
   * Opt-in entrance motion (default `false`): the mean line draws on when
   * the chart first mounts client-side. Inert on the server and on
   * hydrated server HTML; `prefers-reduced-motion` always wins.
   */
  animate?: boolean;
}

export function EnsembleGhosts(props: InteractiveEnsembleGhostsProps): React.ReactNode {
  const {
    data,
    ghosts = 8,
    emphasis = "nearest-median",
    domain,
    format,
    locale,
    width = 80,
    height = 20,
    strings = EN_ENSEMBLE,
    title,
    summary,
    animate = false,
    readout = true,
    className,
    style,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
    ...rest
  } = props;

  const hostRef = useRef<HTMLSpanElement>(null);
  useEntrance(hostRef, "draw", animate);

  const geo = useMemo(
    () => ensembleGeometry({ width, height, data, ghosts, emphasis, domain }),
    [width, height, data, ghosts, emphasis, domain],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  // Ambient HOP frame — path paint stays DOM-only; hopMember drives the chip.
  const hopRef = useRef<number | null>(null);
  const [hopMember, setHopMember] = useState<number | null>(null);
  const [stopped, setStopped] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const reduced = usePrefersReducedMotion();

  // Navigable unit = a drawn ghost strand, indexed by its MEMBER index (the
  // index into `data`), so `onActive`/`selectedIndex` speak the consumer's
  // space. Only the deterministically selected ghosts are navigable.
  const paths = useMemo(() => geo?.ghostPaths ?? [], [geo]);
  const posOf = useCallback(
    (member: number) => paths.findIndex((g) => g.member === member),
    [paths],
  );

  const paintHop = useCallback(
    (member: number | null) => {
      const svg = hostRef.current?.querySelector("svg");
      if (!svg) return;
      const g = hopGroup(svg);
      if (member === null) {
        g.replaceChildren();
        return;
      }
      const src = paths[posOf(member)];
      if (!src) {
        g.replaceChildren();
        return;
      }
      let el = g.querySelector("path") as SVGPathElement | null;
      if (!el) {
        el = document.createElementNS(SVG_NS, "path");
        el.setAttribute("fill", "none");
        el.setAttribute("stroke-linejoin", "round");
        el.setAttribute("stroke-linecap", "round");
        el.setAttribute("vector-effect", "non-scaling-stroke");
        el.style.stroke = "var(--mc-accent)";
        el.style.strokeWidth = "var(--mc-stroke-width)";
        g.appendChild(el);
      }
      el.setAttribute("d", src.d);
    },
    [paths, posOf],
  );

  // Strand vertices parsed from the EMITTED path data — the hit-test can never
  // drift from the drawn geometry because it reads the same numbers.
  const verts = useMemo(() => paths.map((g) => (g.d.match(/[-\d.]+/g) ?? []).map(Number)), [paths]);

  const stop = useCallback(() => {
    if (timer.current !== null) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const endOf = useCallback(
    (member: number): number | null => {
      const m = data[member];
      return m && m.length > 0 ? m[m.length - 1]! : null;
    },
    [data],
  );
  const say = useCallback(
    (member: number): string => {
      const end = endOf(member);
      if (geo === null) return "";
      // A member's terminal value may be absent or non-finite; never format it —
      // `end === null` alone would still leak a trailing NaN/±Infinity.
      return isFiniteValue(end)
        ? strings.ensembleAt(member + 1, geo.memberCount, fmt(end))
        : strings.ensembleEmpty(member + 1, geo.memberCount);
    },
    [endOf, geo, strings, fmt],
  );
  const chip = useCallback(
    (member: number): string => {
      const end = endOf(member);
      return isFiniteValue(end) ? `#${member + 1} · ${fmt(end)}` : `#${member + 1}`;
    },
    [endOf, fmt],
  );

  // Tap/click picks the nearest strand: x is weighted low because the members
  // share every x stop — vertical proximity is what identifies a strand.
  const locate = useCallback(
    (x: number, y: number) => {
      let best: number | null = null;
      let bestDist = Infinity;
      for (let p = 0; p < verts.length; p++) {
        const v = verts[p]!;
        for (let i = 0; i + 1 < v.length; i += 2) {
          const d = Math.abs(v[i]! - x) * 0.5 + Math.abs(v[i + 1]! - y);
          if (d < bestDist) {
            bestDist = d;
            best = paths[p]!.member;
          }
        }
      }
      return best;
    },
    [verts, paths],
  );

  // Members wrap circularly (a bundle has no "ends"), so ←/→ never dead-end.
  const step = useCallback(
    (cur: number, key: string) => {
      const n = paths.length;
      if (n === 0) return null;
      const p = cur < 0 ? -1 : posOf(cur);
      switch (key) {
        case "ArrowRight":
        case "ArrowDown":
          return paths[p < 0 ? 0 : (p + 1) % n]!.member;
        case "ArrowLeft":
        case "ArrowUp":
          return paths[p < 0 ? 0 : (p - 1 + n) % n]!.member;
        case "Home":
          return paths[0]!.member;
        case "End":
          return paths[n - 1]!.member;
      }
      return null;
    },
    [paths, posOf],
  );

  // `value` = the member's TERMINAL value — the number this chart is read for
  // ("ends at …"), and the key the ghost bundle is ranked by.
  const datum = useCallback(
    (member: number) => {
      const end = endOf(member);
      return { index: member, value: end, formatted: isFiniteValue(end) ? fmt(end) : "" };
    },
    [endOf, fmt],
  );

  const { active, selected, bind } = useActivePicker({
    count: paths.length,
    width,
    height,
    locate,
    datum,
    step,
    onActive,
    onSelect,
    selectedIndex,
    defaultSelectedIndex,
  });

  const startLoop = useCallback(() => {
    setStopped("");
    if (reduced || paths.length < 2 || timer.current !== null || selected !== null) return;
    timer.current = setInterval(() => {
      const p = hopRef.current === null ? -1 : posOf(hopRef.current);
      const next = paths[(p + 1) % paths.length]!.member;
      hopRef.current = next;
      setHopMember(next);
      paintHop(next);
    }, 400);
  }, [reduced, paths, posOf, selected, paintHop]);

  const clearHop = useCallback(() => {
    hopRef.current = null;
    setHopMember(null);
    paintHop(null);
  }, [paintHop]);

  useEffect(() => stop, [stop]);

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : ensembleSummary(geo, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const shown = active ?? selected ?? hopMember;
  // announce where the loop stopped (never per frame) — hopMember drives only
  // the visual chip, not the live region
  const announced = shown !== null && (active !== null || selected !== null) ? say(shown) : stopped;

  const leave = () => {
    stop();
    const last = hopRef.current ?? active;
    clearHop();
    if (last !== null) setStopped(say(last));
  };

  const strand = (member: number, pinned: boolean) => {
    const g = paths[posOf(member)];
    if (!g) return null;
    return (
      <path
        d={g.d}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
        data-mc-w={pinned ? "tick" : undefined}
        vectorEffect="non-scaling-stroke"
        style={{
          stroke: "var(--mc-accent)",
          strokeWidth: pinned ? undefined : "var(--mc-stroke-width)",
        }}
      />
    );
  };

  const svgStyle = useMemo(() => fillFor(style), [style]);

  return (
    <span
      ref={hostRef}
      {...wrap("mc-ensemble-ghosts-live", className, style)}
      {...named(ariaLabel)}
      onPointerEnter={startLoop}
      onFocus={startLoop}
      onPointerDown={bind.onPointerDown}
      onPointerUp={bind.onPointerUp}
      onClick={(e) => {
        stop();
        clearHop();
        bind.onClick(e);
      }}
      onKeyDown={(e) => {
        // a keyboard step (or Escape) pauses the ambient loop
        stop();
        clearHop();
        if (e.key === "Escape") setStopped("");
        bind.onKeyDown(e);
      }}
      onPointerLeave={() => {
        bind.onPointerLeave();
        leave();
      }}
      onBlur={() => {
        bind.onBlur();
        leave();
      }}
    >
      <Static
        {...rest}
        style={svgStyle}
        data={data}
        ghosts={ghosts}
        emphasis={emphasis}
        domain={domain}
        format={format}
        locale={locale}
        width={width}
        height={height}
        strings={strings}
        summary={false}
      >
        {selected !== null && selected !== active ? strand(selected, true) : null}
        {active !== null ? strand(active, false) : null}
        {rest.children}
      </Static>
      <LiveRegion>{announced}</LiveRegion>
      {readout && shown !== null ? (
        <span className="mc-spark-readout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          {chip(shown)}
        </span>
      ) : null}
    </span>
  );
}
