import { test as base } from "@playwright/test";

/**
 * Shared visual-test fixture. Every spec builds one `gallery()` string and takes
 * a single `argosScreenshot`. Instead of running each spec twice (a `light` and a
 * `dark` Playwright project — two Argos uploads per chart), we clone the gallery
 * into a forced-dark panel and capture both themes in ONE screenshot. That halves
 * Argos uploads (208 → 104 per build) with no loss of light/dark coverage, which
 * matters on the free plan's 5,000-screenshot monthly cap.
 *
 * Dark is driven by `[data-mc-theme="dark"]` — the same token scope the docs site
 * and styles.css expose — not the browser color-scheme, so both themes coexist on
 * one page. The dark panel re-asserts `color: var(--mc-stroke)` because the
 * gallery's own `body { color: … }` rule would otherwise bleed the light stroke
 * into it and wash the marks out on the dark background.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    const setContent = page.setContent.bind(page);
    page.setContent = ((html: string, options?: Parameters<typeof setContent>[1]) =>
      setContent(
        `<div class="vt-panel vt-light" style="padding:24px">${html}</div>` +
          `<div class="vt-panel vt-dark" data-mc-theme="dark" style="padding:24px;background:#0c0d0e;color:var(--mc-stroke)">${html}</div>`,
        options,
      )) as typeof page.setContent;
    // `use` is Playwright's fixture-teardown callback, not React's `use` hook —
    // the name is the only thing the lint rule can see.
    // oxlint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect } from "@playwright/test";
