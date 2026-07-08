// Chart craft audit: renders every chart in every label-bearing combination at
// several sizes; flags (1) text outside the viewBox, (2) text-text overlap,
// (3) text sitting on data marks (rect/circle overlap beyond a tolerance).
import { renderToStaticMarkup } from "react-dom/server";
import { createElement as h } from "react";

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : null;
};

function textBox(tag) {
  const x = Number(attr(tag, "x")),
    y = Number(attr(tag, "y"));
  const fs = Number(attr(tag, "font-size") ?? 10);
  const anchor = attr(tag, "text-anchor") ?? "start";
  const db = attr(tag, "dominant-baseline");
  const txt = tag.match(/>([^<]*)<\/text>/)?.[1] ?? "";
  const est = txt.length * 0.62 * fs;
  const x0 = anchor === "end" ? x - est : anchor === "middle" ? x - est / 2 : x;
  const mid = db === "middle" || db === "central";
  return {
    x0,
    x1: x0 + est,
    y0: mid ? y - fs * 0.5 : y - fs * 0.78,
    y1: mid ? y + fs * 0.5 : y + fs * 0.22,
    txt,
    fs,
  };
}

function marks(html) {
  const out = [];
  for (const m of html.matchAll(/<rect[^>]*>/g)) {
    const t = m[0];
    if (t.includes('fill="none"') || (t.includes("stroke") && !t.includes("fill"))) continue;
    // reference bands are BACKGROUNDS (faint --mc-band fill) — labels may sit on them
    if (t.includes('data-mc-ink="band"')) continue;
    out.push({
      x0: Number(attr(t, "x")),
      x1: Number(attr(t, "x")) + Number(attr(t, "width")),
      y0: Number(attr(t, "y")),
      y1: Number(attr(t, "y")) + Number(attr(t, "height")),
      kind: "rect",
    });
  }
  for (const m of html.matchAll(/<circle[^>]*>/g)) {
    const t = m[0],
      cx = Number(attr(t, "cx")),
      cy = Number(attr(t, "cy")),
      r = Number(attr(t, "r"));
    out.push({ x0: cx - r, x1: cx + r, y0: cy - r, y1: cy + r, kind: "circle" });
  }
  return out;
}

const overlap = (a, b, tol = 0.4) =>
  Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > tol &&
  Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > tol;

export function audit(name, html) {
  const vb = html.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!vb) return [`${name}: NO SVG`];
  const W = Number(vb[1]),
    H = Number(vb[2]);
  const texts = [...html.matchAll(/<text[^>]*>[^<]*<\/text>/g)].map((m) => textBox(m[0]));
  const issues = [];
  for (const t of texts) {
    if (t.x0 < -0.3 || t.x1 > W + 0.3 || t.y0 < -0.3 || t.y1 > H + 0.3)
      issues.push(
        `ESCAPE "${t.txt}" [${t.x0.toFixed(1)},${t.y0.toFixed(1)}..${t.x1.toFixed(1)},${t.y1.toFixed(1)}] vb ${W}x${H}`,
      );
  }
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++)
      if (overlap(texts[i], texts[j]))
        issues.push(`TEXT-TEXT "${texts[i].txt}" × "${texts[j].txt}"`);
  const mk = marks(html);
  for (const t of texts)
    for (const m of mk)
      if (overlap(t, m, 1.0))
        issues.push(
          `TEXT-ON-MARK "${t.txt}" over ${m.kind} [${m.x0.toFixed(1)},${m.y0.toFixed(1)}..${m.x1.toFixed(1)},${m.y1.toFixed(1)}]`,
        );
  return issues.map((s) => `${name}: ${s}`);
}

export const render = (Comp, props) => renderToStaticMarkup(h(Comp, { ...props, summary: false }));
