/** Build-time env → favicon colour (prod / staging / local). */
export type AppEnv = "production" | "staging" | "development";

export function appEnv(): AppEnv {
  const raw = (
    process.env.ENV_STYLES_ENV ||
    process.env.VERCEL_TARGET_ENV ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "production"
  ).toLowerCase();
  if (raw === "development") return "development";
  if (raw === "production") return "production";
  return "staging";
}

// Ember (the brand default) signals production; cobalt + teal stay visually
// distinct for staging + local so the favicon still tells environments apart.
export const ENV_ICON: Record<AppEnv, { bg: string; label: string }> = {
  production: { bg: "#c2410c", label: "prod" },
  staging: { bg: "#2f52d4", label: "staging" },
  development: { bg: "#0f766e", label: "dev" },
};

export function envIcon() {
  return ENV_ICON[appEnv()];
}
