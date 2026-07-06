// Theming entry (plan/06 §3). Hook-free → RSC-safe. Applies a preset via the
// `data-mc-theme` attribute (pure-CSS token bundle, see styles.css) and/or
// one-off `--mc-*` overrides as inline custom properties. Presets are visual
// only — they never change data semantics (plan/06 §3).
import type { CSSProperties, ReactNode } from "react";

/** Built-in presets (token bundles in styles.css). `modern` is the default. */
export type Preset = "modern" | "tufte" | "mono" | "vivid" | "dark";

export interface MicroProviderProps {
  theme?: Preset;
  /** One-off token overrides, e.g. `{ '--mc-accent': '#f50' }`. */
  tokens?: Record<`--mc-${string}`, string | number>;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function MicroProvider(props: MicroProviderProps): ReactNode {
  const { theme = "modern", tokens, className, style, children } = props;
  const mergedStyle = (tokens ? { ...tokens, ...style } : style) as CSSProperties;
  return (
    <div
      data-mc-theme={theme === "modern" ? undefined : theme}
      className={className}
      style={mergedStyle}
    >
      {children}
    </div>
  );
}
