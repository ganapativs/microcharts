// A PROP must never take a mark's role away.
//
// `data-mc-ink` (and `data-mc-cat` for the categorical family) is not decoration
// — it is the handle every role-keyed rule in styles.css reaches for: the paint
// tokens, the forced-colors remap, the motion layer, and now the data-change
// transition. So a chart written like this
//
//   data-mc-ink={color ? undefined : "point"}
//
// silently changes what the mark IS whenever a consumer passes `color`. The mark
// keeps its custom paint and loses everything else — in `bias-strip` that meant
// out-of-limits dots kept gliding on a data change while every in-limits dot
// jumped, and in `control-strip` the dots dropped out of the High Contrast Mode
// remap. Neither is visible in a screenshot of the default theme, which is why
// this is a source guard rather than a rendering test.
//
// The fix is always the same shape: keep the role, and let an INLINE style carry
// the custom paint. Inline wins over the `:where()` role rules outright, so the
// override still works and nothing keyed on the role is lost. A `fill="..."`
// ATTRIBUTE cannot do this — an attribute loses to any stylesheet rule, which is
// what pushed these charts into dropping the role in the first place.
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const chartsDir = resolve(import.meta.dirname, "../charts");

/**
 * Charts allowed to resolve a role attribute to `undefined`, with the reason.
 * Every entry is a mark that swaps to the OTHER role attribute on the same
 * element, so it is never left with no role at all.
 */
const ALLOWED: Record<string, string> = {
  "segmented-bar":
    "swaps data-mc-ink for data-mc-cat on the same rect — categorical segments are painted by the cat ramp, never by an ink role",
  hypnogram:
    "same swap as segmented-bar: emphasis mode uses ink roles, categorical mode uses data-mc-cat",
  horizon:
    "a filled <path>: re-adding the accent role would hit the line-shaped element-split rule and stroke an outline around every band. Tier C, so it never travelled anyway",
};

/** `data-mc-ink={...}` / `data-mc-cat={...}` expressions, one per match. */
function roleExpressions(src: string): { attr: string; expr: string; line: number }[] {
  const out: { attr: string; expr: string; line: number }[] = [];
  const re = /data-mc-(ink|cat)=\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
  for (const m of src.matchAll(re)) {
    out.push({
      attr: `data-mc-${m[1]}`,
      expr: m[2] ?? "",
      line: src.slice(0, m.index).split("\n").length,
    });
  }
  return out;
}

/**
 * The JSX opening tag a match sits in — from its `<` back to the `>` that closes
 * the tag. Role attributes only ever appear in an opening tag, so scanning back
 * to the nearest `<` and forward to the first unbraced `>` is exact enough here,
 * and it is what lets the guard ask the only question that matters: does this
 * ELEMENT still have a role once the conditional resolves to `undefined`?
 */
function openingTag(src: string, at: number): string {
  const start = src.lastIndexOf("<", at);
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (ch === ">" && depth === 0) return src.slice(start, i + 1);
  }
  return src.slice(start);
}

/** A role attribute that cannot resolve to `undefined` — the element's floor. */
function hasUnconditionalRole(tag: string): boolean {
  if (/data-mc-(ink|cat)="[^"]+"/.test(tag)) return true;
  return roleExpressions(tag).some(({ expr }) => !/\bundefined\b/.test(expr));
}

const slugs = readdirSync(chartsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

describe("a prop never removes a mark's role", () => {
  it("no chart resolves data-mc-ink / data-mc-cat to undefined outside the documented swaps", () => {
    const offenders: string[] = [];

    for (const slug of slugs) {
      let src: string;
      try {
        src = readFileSync(resolve(chartsDir, slug, "index.tsx"), "utf8");
      } catch {
        continue;
      }
      const re = /data-mc-(?:ink|cat)=\{/g;
      for (const m of src.matchAll(re)) {
        const tag = openingTag(src, m.index);
        // `x ?? "role"` and `x ? "a" : "b"` always land on a role, and an element
        // carrying a second, unconditional role attribute never goes bare.
        if (hasUnconditionalRole(tag)) continue;
        const bare = roleExpressions(tag).filter(({ expr }) => /\bundefined\b/.test(expr));
        if (!bare.length || ALLOWED[slug]) continue;
        const line = src.slice(0, m.index).split("\n").length;
        offenders.push(
          `${slug}/index.tsx:${line} ${bare.map((b) => `${b.attr}={${b.expr.trim()}}`).join(" ")}`,
        );
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every allowlisted chart still contains the swap it is excused for", () => {
    for (const slug of Object.keys(ALLOWED)) {
      const src = readFileSync(resolve(chartsDir, slug, "index.tsx"), "utf8");
      const exprs = roleExpressions(src);
      expect(
        exprs.some(({ expr }) => /\bundefined\b/.test(expr)),
        `${slug} no longer drops a role — remove it from ALLOWED`,
      ).toBe(true);
    }
  });
});

// A role is only inert when the inline style covers EVERY property it sets.
//
// Three roles carry an opacity as well as a colour — `fill` (0.12), `ghost`, and
// `region`. A mark that borrows one of them and overrides only `fill` keeps the
// role's opacity, which is how the Thermometer's mercury came to be painted at
// 12% and the whole instrument read as empty: the right colour, almost
// invisible. It is the kind of defect no assertion in the suite would catch,
// because every coordinate is still correct.
describe("a role's opacity is never inherited by accident", () => {
  const OPACITY_ROLES = new Set(["fill", "ghost", "region"]);

  /**
   * Marks that recolour an opacity-carrying role and MEAN to stay translucent.
   * Sparkline's area is the role's own use case: a wash under the line, and a
   * caller's `color` changes its hue without making it opaque enough to compete
   * with the line it sits beneath.
   */
  const INTENTIONALLY_TRANSLUCENT = new Set(["sparkline/index.tsx:198"]);

  it("a mark that overrides a colour also owns the opacity that came with it", () => {
    const offenders: string[] = [];

    for (const slug of readdirSync(chartsDir, { withFileTypes: true })) {
      if (!slug.isDirectory()) continue;
      for (const file of ["index.tsx", "client.tsx"]) {
        let src: string;
        try {
          src = readFileSync(resolve(chartsDir, slug.name, file), "utf8");
        } catch {
          continue;
        }
        for (const m of src.matchAll(/<(rect|circle|line|ellipse|path)\b/g)) {
          let depth = 0;
          let tag = "";
          for (let i = m.index; i < src.length; i++) {
            const ch = src[i];
            if (ch === "{") depth++;
            else if (ch === "}") depth--;
            else if (ch === ">" && depth === 0) {
              tag = src.slice(m.index, i + 1);
              break;
            }
          }
          const role = tag.match(/data-mc-ink="([a-z]+)"/)?.[1];
          if (!role || !OPACITY_ROLES.has(role)) continue;
          // Only marks that repaint are at risk: one that takes the role's own
          // colour wants the role's own opacity with it.
          if (!/style=\{[^}]*fill/.test(tag)) continue;
          if (/fillOpacity[:=]/.test(tag)) continue;
          const at = `${slug.name}/${file}:${src.slice(0, m.index).split("\n").length}`;
          if (INTENTIONALLY_TRANSLUCENT.has(at)) continue;
          offenders.push(
            `${at} <${m[1]}> ` +
              `role="${role}" sets fill-opacity, but the inline style only overrides fill`,
          );
        }
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
