import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CONTACT_PAGE,
  GA_PROPERTY,
  PRIVACY_PAGE,
  STORAGE_KEYS,
  THIRD_PARTIES,
  trustPageMarkdown,
  type TrustPage,
} from "./trust-pages.ts";
import { SITE } from "./site.ts";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

describe.each([
  ["contact", CONTACT_PAGE, "/contact"],
  ["privacy", PRIVACY_PAGE, "/privacy"],
])("%s page", (_name, page: TrustPage, path) => {
  const md = trustPageMarkdown(page, `${SITE.url}${path}`);

  it("carries enough substance to answer the question it names", () => {
    expect(md.length).toBeGreaterThan(500);
  });

  it("opens with an H1 and keeps one heading per section", () => {
    expect(md.startsWith(`# ${page.title} (`)).toBe(true);
    expect((md.match(/^## /gm) ?? []).length).toBe(page.sections.length);
  });

  it("gives every section a unique anchor", () => {
    const ids = page.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z-]*$/);
  });

  it("closes every inline construct it opens", () => {
    for (const block of page.sections.flatMap((s) => s.blocks)) {
      const text = "p" in block ? block.p : block.list.join(" ");
      expect((text.match(/`/g) ?? []).length % 2, text).toBe(0);
      expect((text.match(/\[/g) ?? []).length).toBe((text.match(/\]\(/g) ?? []).length);
    }
  });

  it("links only to real destinations", () => {
    for (const [, href] of md.matchAll(/\]\((.*?)\)/g)) {
      expect(href.startsWith("https://") || href.startsWith("/"), href).toBe(true);
    }
  });
});

describe("contact routes", () => {
  it("names the issue tracker and the private security channel", () => {
    const md = trustPageMarkdown(CONTACT_PAGE, `${SITE.url}/contact`);
    expect(md).toContain(`${SITE.repo}/issues`);
    expect(md).toContain(`${SITE.repo}/security/advisories/new`);
    expect(md).toContain(SITE.email);
  });

  it("uses the address SECURITY.md publishes", () => {
    expect(read("../../../../SECURITY.md")).toContain(SITE.email);
  });
});

/**
 * The privacy page is only worth publishing if it is true. Each claim is
 * checked against the component that would make it false, so adding a tracker
 * or a storage key without updating the page fails here.
 */
describe("privacy claims match the code", () => {
  const analytics = read("../components/analytics.tsx");
  const githubStars = read("../components/github-stars.tsx");
  const md = trustPageMarkdown(PRIVACY_PAGE, `${SITE.url}/privacy`);

  it("names the analytics property the site actually loads", () => {
    expect(analytics).toContain(GA_PROPERTY);
    expect(md).toContain(GA_PROPERTY);
  });

  it("names every third-party host a page can call", () => {
    for (const { host } of THIRD_PARTIES) expect(md).toContain(host);
    expect(analytics).toContain("googletagmanager.com");
    expect(githubStars).toContain("api.github.com");
  });

  it("declares no host the code does not call", () => {
    const source = [analytics, githubStars, read("../components/ui/stackblitz-sandbox.tsx")].join(
      "\n",
    );
    for (const { host } of THIRD_PARTIES) {
      const root = host.split(".").slice(-2).join(".");
      expect(source, host).toContain(root);
    }
  });

  it("lists every localStorage key the site writes", () => {
    for (const key of STORAGE_KEYS) expect(md, key).toContain(key);
    expect(githubStars).toContain("mc-gh-stars");
  });

  it("states that the package itself collects nothing", () => {
    expect(md).toContain("zero runtime dependencies");
  });
});
