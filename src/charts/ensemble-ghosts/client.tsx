"use client";
// Interactive <EnsembleGhosts> (plan/23 #20) — the HOP loop. On hover/focus,
// cycle members one at a time at full opacity (~400 ms/frame ≈ 2.5 Hz, the
// studied Hypothetical-Outcome-Plots cadence), looping until the pointer leaves.
// Reduced-motion: NO loop — ←/→ step members discretely (same information,
// no motion). The live region announces only on a keyboard step or when the
// loop stops — never per frame. Composes the static component (canon).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { makeFormatter } from "../../core/format.js";
import { EN_ENSEMBLE, type EnsembleStrings } from "../../core/strings-ensemble.js";
import { ensembleGeometry } from "./geometry.js";
import {
  EnsembleGhosts as StaticEnsembleGhosts,
  ensembleSummary,
  type EnsembleGhostsProps,
} from "./index.js";

export interface InteractiveEnsembleGhostsProps extends EnsembleGhostsProps {
  strings?: EnsembleStrings;
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
    ...rest
  } = props;

  const geo = useMemo(
    () => ensembleGeometry({ width, height, data, ghosts, emphasis, domain }),
    [width, height, data, ghosts, emphasis, domain],
  );
  const fmt = useMemo(() => makeFormatter(format, locale), [format, locale]);
  const [active, setActive] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = (): void => setReduced(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const paths = useMemo(() => geo?.ghostPaths ?? [], [geo]);
  const stop = useCallback(() => {
    if (timer.current !== null) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const memberEnd = useCallback(
    (member: number): string => {
      const m = data[member]!;
      return fmt(m[m.length - 1]!);
    },
    [data, fmt],
  );

  const accName =
    summary === false
      ? undefined
      : typeof summary === "string"
        ? summary
        : geo === null
          ? strings.noData
          : ensembleSummary(geo, fmt, strings);
  const ariaLabel = [title, accName].filter(Boolean).join(". ") || undefined;

  const startLoop = useCallback(() => {
    if (reduced || paths.length < 2 || timer.current !== null) return;
    timer.current = setInterval(() => {
      setActive((p) => (p === null ? 0 : (p + 1) % paths.length));
    }, 400);
  }, [reduced, paths.length]);

  const onLeave = useCallback(() => {
    stop();
    // announce where the loop stopped (never per frame)
    setActive((p) => {
      if (p !== null && paths[p])
        setAnnounce(
          strings.ensembleAt(paths[p]!.member + 1, geo!.memberCount, memberEnd(paths[p]!.member)),
        );
      return null;
    });
  }, [stop, paths, geo, strings, memberEnd]);

  useEffect(() => stop, [stop]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (paths.length === 0) return;
      let step: number | null = null;
      if (e.key === "ArrowRight") step = 1;
      else if (e.key === "ArrowLeft") step = -1;
      else if (e.key === "Escape") {
        stop();
        setActive(null);
        setAnnounce("");
        return;
      } else return;
      e.preventDefault();
      stop(); // a keyboard step pauses the loop
      setActive((p) => {
        const next = p === null ? 0 : (p + step! + paths.length) % paths.length;
        setAnnounce(
          strings.ensembleAt(
            paths[next]!.member + 1,
            geo!.memberCount,
            memberEnd(paths[next]!.member),
          ),
        );
        return next;
      });
    },
    [paths, stop, strings, geo, memberEnd],
  );

  const activePath = active !== null ? paths[active] : undefined;

  return (
    <span
      className="mc-ensemble-ghosts-live"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
      tabIndex={0}
      role="img"
      aria-label={ariaLabel}
      onPointerEnter={startLoop}
      onFocus={startLoop}
      onPointerLeave={onLeave}
      onBlur={onLeave}
      onKeyDown={onKeyDown}
    >
      <StaticEnsembleGhosts
        {...rest}
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
        {/* the HOP frame — the currently surfaced member, full accent on top */}
        {activePath ? (
          <path
            d={activePath.d}
            fill="none"
            stroke="var(--mc-accent)"
            strokeWidth={1.4}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {rest.children}
      </StaticEnsembleGhosts>
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
        {announce}
      </span>
    </span>
  );
}
