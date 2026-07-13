// <StatusDot> — "what state is this thing in right now?" (, S4
// categorical). Static, hook-free, RSC-safe. Each state pairs a distinct
// silhouette with a semantic token — never color-alone by construction; the
// mapping is a contract (`color` recolors, never reshapes). Five built-ins;
// `states` extends the vocabulary while preserving the pairing invariant.
import type { CSSProperties, ReactNode } from "react";
import { Chart } from "../../shared/Chart.js";
import { devWarn } from "../../core/dev.js";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { statusDotGeometry, type StatusGlyph } from "./geometry.js";

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
  const state = map[status];
  if (state) return state;
  devWarn(`<StatusDot> unknown status "${status}" — rendering the "off" glyph.`);
  return STATUS_STATES.off!;
}

export interface StatusDotProps {
  /** Built-in `"ok" | "warn" | "error" | "off" | "busy"`, or a `states` key. */
  status: string;
  /** Live-now halo (CSS keyframe, reduced-motion-gated) — monitoring contexts. */
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
  const accName = summary === false ? false : (summary ?? strings.status(state.label));

  return (
    <Chart
      width={SIZE}
      height={SIZE}
      title={title}
      summary={accName}
      id={id}
      className={className ? `mc-status ${className}` : "mc-status"}
      style={style}
    >
      {pulse ? (
        <circle
          className="mc-status-halo"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={3}
          style={{ fill }}
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
          style={mark.hollow ? { fill: "none", stroke: fill } : { fill, stroke: "none" }}
        />
      ) : mark.kind === "path" ? (
        <path d={mark.d} data-mc-status={state.glyph} style={{ fill, stroke: "none" }} />
      ) : (
        <>
          <circle
            cx={mark.cx}
            cy={mark.cy}
            r={mark.r}
            data-mc-status="half"
            data-mc-w="support"
            style={{ fill: "none", stroke: fill }}
          />
          <path d={mark.d} style={{ fill, stroke: "none" }} />
        </>
      )}
      {children}
    </Chart>
  );
}
