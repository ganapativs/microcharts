// <StatusDot> — "what state is this thing in right now?" (S4 categorical).
// Each state pairs a distinct
// silhouette with a semantic token — never color-alone by construction; the
// mapping is a contract (`color` recolors, never reshapes). Five built-ins;
// `states` extends the vocabulary while preserving the pairing invariant.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { statusDotGeometry, type StatusGlyph } from "./geometry.js";
import { resolveSummary } from "../../core/summary.js";

export interface StatusState {
  glyph: StatusGlyph;
  /** CSS custom property, e.g. `"--mc-positive"` (semantic token, not a hex). */
  token: string;
  /** Feeds the summary: "Status: ‹label›." */
  label: string;
}

/** The built-in state contract (documented; silhouettes survive grayscale). */
export const STATUS_STATES: Record<string, StatusState> = {
  ok: { glyph: "circle", token: "--mc-positive", label: "ok" },
  warn: { glyph: "triangle", token: "--mc-cat-1", label: "warning" },
  error: { glyph: "diamond", token: "--mc-negative", label: "error" },
  off: { glyph: "ring", token: "--mc-neutral", label: "off" },
  busy: { glyph: "half", token: "--mc-accent", label: "busy" },
};

/** Resolve a status key against built-ins + overrides; unknown → `off` + warn. */
export function resolveStatus(status: string, states?: Record<string, StatusState>): StatusState {
  const map = states ? { ...STATUS_STATES, ...states } : STATUS_STATES;
  // Own keys only. `status` is DATA — any string is in contract, and the plain
  // lookup resolved "constructor" / "toString" / "__proto__" through
  // Object.prototype to a truthy function whose `.glyph` is undefined. Geometry
  // then fell off its switch and the render threw on `mark.kind`, taking the
  // whole tree down instead of falling back to "off".
  const state = Object.hasOwn(map, status) ? map[status] : undefined;
  if (state) return state;
  devWarn(`<StatusDot> unknown status "${status}" — rendering the "off" glyph.`);
  return STATUS_STATES.off!;
}

export interface StatusDotProps {
  /** Built-in `"ok" | "warn" | "error" | "off" | "busy"`, or a `states` key. */
  status: string;
  /**
   * Live-now halo: a pulsing ring behind the mark, CSS-only and
   * reduced-motion-gated. Default off, and independent of `status` — every state
   * pulses the same way when you ask for it.
   *
   * This is the catalog's one DOCUMENTED exemption from the "no looping
   * animation" rule (see design-notes), and the one thing besides
   * `<Marker celebrate>` that moves inside a static host. The loop is the
   * reading, not decoration: a monitoring dot that pulses says "this feed is
   * live", and the same dot holding still says it stopped — which is the state a
   * reader most needs to notice. Turn it off anywhere the liveness of the value
   * is not itself part of the reading.
   */
  pulse?: boolean | undefined;
  /** Extend/override the state map for domain vocabularies (pairing preserved). */
  states?: Record<string, StatusState> | undefined;
  /** Recolors the active state; never reshapes it. */
  color?: string | undefined;
  strings?: ScalarStrings | undefined;
  title?: string | undefined;
  summary?: string | false | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

const SIZE = 8;

export function StatusDot(props: StatusDotProps): ReactNode {
  const {
    status,
    pulse = false,
    states,
    color,
    strings = EN_SCALAR,
    title,
    summary,
    id,
    className,
    style,
    children,
  } = props;

  const state = resolveStatus(status, states);
  const mark = statusDotGeometry({ width: SIZE, height: SIZE, glyph: state.glyph });
  const fill = color ?? `var(${state.token})`;
  const accName = resolveSummary(summary, () => strings.status(state.label));

  return (
    <Chart
      width={SIZE}
      height={SIZE}
      title={title}
      summary={accName}
      id={id}
      // All five silhouettes are drawn about the center of the SIZE box (the
      // triangle's 0.35 nudge is an optical correction, not a floor), so the box
      // is the plot box and one seat holds for every state.
      seat={{ mode: "center", top: 0, bottom: SIZE }}
      className={className ? `mc-status ${className}` : "mc-status"}
      style={style}
    >
      {/* Paint rides presentation attributes, never inline `style`. The fill is
          dynamic, so it has to come from the component — but an inline
          declaration outranks every author rule, and `.mc-root` sets
          `forced-color-adjust: none`, so the forced-colors mapping styles.css
          writes for `[data-mc-status]` never applied: High Contrast Mode painted
          #0E7A5F / #8a8986 against the user's own background. An attribute sits
          below the stylesheet, so the mapping wins there and `color` everywhere
          else — and a hollow mark's literal `fill="none"` is what the blanket
          hollow-mark rule reads. */}
      {pulse ? (
        // The halo carries the same dynamic ink, so it needs the same mapping.
        // "halo" stays outside the glyph vocabulary: it is not a silhouette, and
        // the value-scoped ring/half rules must not claim it.
        <circle
          className="mc-status-halo"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={3}
          data-mc-status="halo"
          fill={fill}
          aria-hidden="true"
        />
      ) : null}
      {mark.kind === "circle" ? (
        <circle
          cx={mark.cx}
          cy={mark.cy}
          r={mark.r}
          data-mc-status={state.glyph}
          data-mc-w={mark.hollow ? "support" : undefined}
          fill={mark.hollow ? "none" : fill}
          stroke={mark.hollow ? fill : "none"}
        />
      ) : mark.kind === "path" ? (
        <path d={mark.d} data-mc-status={state.glyph} fill={fill} stroke="none" />
      ) : (
        <>
          <circle
            cx={mark.cx}
            cy={mark.cy}
            r={mark.r}
            data-mc-status="half"
            data-mc-w="support"
            fill="none"
            stroke={fill}
          />
          {/* The half-disc is half the busy silhouette and was the one mark
              with no `data-mc-status` at all — unmapped even once the paint
              moved off `style`. */}
          <path d={mark.d} data-mc-status="half" fill={fill} stroke="none" />
        </>
      )}
      {children}
    </Chart>
  );
}
