/**
 * Environment-aware favicon colour.
 *
 * A prod build, a preview/staging deploy, and local dev each get a distinct tab
 * colour so a stray non-production tab is obvious at a glance. Detection mirrors
 * env.style's order (ENV_STYLES_ENV → Vercel → NODE_ENV) but is resolved at
 * BUILD time with zero runtime and no dependency — which is what a static export
 * (`output: 'export'`) needs. Hand-rolled instead of the `env.style` package:
 * that package is 2 days old, single-maintainer, pulls `sharp`, and its static-
 * export support is undocumented (see plan/12-research-audit.md).
 */
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
  // vercel "preview", a custom "staging" target, "test", anything unknown →
  // treat as pre-production so it never masquerades as prod.
  return "staging";
}

// Squircle colour per env. Production keeps the brand cobalt; the others are
// deliberately different + loud so a dev/staging tab can't be mistaken for prod.
export const ENV_ICON: Record<AppEnv, { bg: string; label: string }> = {
  production: { bg: "#2f52d4", label: "prod" }, // cobalt — the brand
  staging: { bg: "#c2410c", label: "staging" }, // ember — "not prod"
  development: { bg: "#0f766e", label: "dev" }, // teal — local
};

export function envIcon() {
  return ENV_ICON[appEnv()];
}
