import { defineTheme } from "@microcharts/react/theme";

// Prussian ink on limestone in light; on dark surfaces the auto-twin of
// `#1a3a5c` collapses to near-white and HeatCell's accent→band ramp washes
// out — pin a chromatic steel blue so intensity steps stay readable.
export const atlasTheme = defineTheme({
  extends: "vivid",
  accent: "#1a3a5c",
  strokeWidth: 1.25,
  density: 1,
  dark: {
    accent: "#6ba3d4",
  },
});
