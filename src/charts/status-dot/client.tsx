"use client";
// Interactive <StatusDot> (plan/22 #2). `live` announces state changes through
// a polite region ("Deploys: warning."). No pointer math — a single 8-px state
// mark has nothing to reveal on hover that the summary doesn't already say
// (documented skip). Composes the static component (canon).
import { useEffect, useRef, useState } from "react";
import { EN_SCALAR, type ScalarStrings } from "../../core/strings-scalar.js";
import { resolveStatus, StatusDot as StaticStatusDot, type StatusDotProps } from "./index.js";

export interface InteractiveStatusDotProps extends StatusDotProps {
  /** Announce when the status changes (default true). */
  live?: boolean;
  strings?: ScalarStrings;
}

export function StatusDot(props: InteractiveStatusDotProps): React.ReactNode {
  const { live = true, strings = EN_SCALAR, title, ...rest } = props;
  const state = resolveStatus(rest.status, rest.states);
  const summaryText = strings.status(state.label);
  const label = [title, summaryText].filter(Boolean).join(". ");

  // Announce only real changes, not the initial mount (an aria-live region's
  // first content is read anyway by some SRs; keep the channel quiet until the
  // state actually moves).
  const [announced, setAnnounced] = useState("");
  const prev = useRef(state.label);
  useEffect(() => {
    if (prev.current === state.label) return;
    prev.current = state.label;
    if (live) setAnnounced(label);
  }, [state.label, label, live]);

  return (
    <span className="mc-status-live" tabIndex={0} role="img" aria-label={label}>
      <StaticStatusDot {...rest} strings={strings} summary={false} />
      {live ? (
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
      ) : null}
    </span>
  );
}
