import { describe, expect, it } from "vitest";
import {
  brandMarkdown,
  chartsMarkdown,
  examplesMarkdown,
  homeMarkdown,
  notFoundMarkdown,
} from "./page-mirrors.ts";
import { STABLE_CHARTS } from "./catalog.ts";
import { COLLECTIONS } from "./collections.ts";
import { CATALOG } from "./docs-facts.ts";
import { SHOWCASE } from "./showcase.ts";
import { SITE } from "./site.ts";

const MIRRORS = [
  ["home", homeMarkdown()],
  ["charts", chartsMarkdown()],
  ["examples", examplesMarkdown()],
  ["brand", brandMarkdown()],
  ["404", notFoundMarkdown()],
] as const;

describe.each(MIRRORS)("the %s mirror", (_name, md) => {
  it("opens with a single H1", () => {
    expect(md.startsWith("# ")).toBe(true);
    expect((md.match(/^# /gm) ?? []).length).toBe(1);
  });

  it("carries real content, not a stub", () => {
    expect(md.length).toBeGreaterThan(500);
  });

  it("balances its code fences", () => {
    expect((md.match(/```/g) ?? []).length % 2).toBe(0);
  });

  it("writes every link as absolute", () => {
    for (const [, href] of md.matchAll(/\]\((.*?)\)/g)) {
      expect(href.startsWith("https://"), href).toBe(true);
    }
  });

  it("never links a path that cannot exist", () => {
    for (const [, href] of md.matchAll(/\]\((https:\/\/microcharts\.dev.*?)\)/g)) {
      expect(href, href).not.toContain("undefined");
      expect(href, href).not.toMatch(/<slug>/);
    }
  });
});

describe("the home mirror", () => {
  const md = homeMarkdown();

  it("states the catalog size the rest of the site states", () => {
    expect(md).toContain(`${CATALOG.total} chart types`);
  });

  it("shows an install line and a working import", () => {
    expect(md).toContain(`npm i ${SITE.pkg}`);
    expect(md).toContain(`import { Sparkline } from "${SITE.pkg}/sparkline"`);
    expect(md).toContain(`import "${SITE.pkg}/styles.css"`);
  });

  it("points at the machine surfaces an agent needs next", () => {
    for (const path of ["/llms.txt", "/catalog.json", "/openapi.json", "/api/charts.json"]) {
      expect(md, path).toContain(`${SITE.url}${path}`);
    }
  });
});

describe("the charts mirror", () => {
  const md = chartsMarkdown();

  it("lists every shipped chart exactly once", () => {
    for (const chart of STABLE_CHARTS) {
      const link = `${SITE.url}/docs/charts/${chart.slug}.md`;
      expect(md.split(link).length - 1, chart.slug).toBe(1);
    }
  });

  it("files them under every collection", () => {
    for (const collection of COLLECTIONS) expect(md).toContain(`### ${collection.label}`);
  });
});

describe("the examples mirror", () => {
  const md = examplesMarkdown();

  it("covers every app in the showcase", () => {
    for (const app of SHOWCASE) {
      expect(md, app.slug).toContain(`### ${app.name}`);
      expect(md, app.slug).toContain(app.url);
    }
  });
});

describe("the 404 mirror", () => {
  const md = notFoundMarkdown();

  it("does not pretend to know which URL missed", () => {
    expect(md).toContain("the URL you requested");
  });

  it("still hands over the entry points", () => {
    expect(md).toContain(`${SITE.url}/llms.txt`);
    expect(md).toContain(`${SITE.url}/sitemap.xml`);
  });
});
