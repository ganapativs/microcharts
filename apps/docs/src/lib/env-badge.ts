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

export const ENV_ICON: Record<AppEnv, { bg: string; label: string }> = {
  production: { bg: "#2f52d4", label: "prod" },
  staging: { bg: "#c2410c", label: "staging" },
  development: { bg: "#0f766e", label: "dev" },
};

export function envIcon() {
  return ENV_ICON[appEnv()];
}
