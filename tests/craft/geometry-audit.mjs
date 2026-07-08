// Geometry craft audit (extends audit.mjs beyond text). Catches:
//  - line passing through the INTERIOR of a hollow (fill=none) circle/rect
//    other than at its own endpoint (the dumbbell "connector pierces the
//    before-dot" class),
//  - filled marks escaping the viewBox,
//  - stray coincident marks that should have been deduped.
// Pure string parsing of rendered SVG — no DOM.
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : null;
};

function circles(html) {
  return [...html.matchAll(/<circle[^>]*>/g)].map((m) => {
    const t = m[0];
    return {
      cx: Number(attr(t, "cx")),
      cy: Number(attr(t, "cy")),
      r: Number(attr(t, "r")),
      hollow: t.includes('fill="none"'),
      raw: t,
    };
  });
}

function lines(html) {
  return [...html.matchAll(/<line[^>]*>/g)].map((m) => {
    const t = m[0];
    return {
      x1: Number(attr(t, "x1")),
      y1: Number(attr(t, "y1")),
      x2: Number(attr(t, "x2")),
      y2: Number(attr(t, "y2")),
      raw: t,
    };
  });
}

// length of segment ab that lies inside the disk at c (radius r) — the visible
// chord that would show through a HOLLOW ring. Any chord longer than a hair
// means the connector crosses the empty interior instead of stopping at the
// edge (the dumbbell "line through the before-dot" bug).
function chordInsideDisk(seg, c) {
  const dx = seg.x2 - seg.x1,
    dy = seg.y2 - seg.y1;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return 0;
  // solve |a + t·d - c|^2 = r^2 for t ∈ [0,1]
  const fx = seg.x1 - c.cx,
    fy = seg.y1 - c.cy;
  const A = len2;
  const B = 2 * (fx * dx + fy * dy);
  const C = fx * fx + fy * fy - c.r * c.r;
  const disc = B * B - 4 * A * C;
  if (disc < 0) return 0;
  const sq = Math.sqrt(disc);
  let t0 = (-B - sq) / (2 * A);
  let t1 = (-B + sq) / (2 * A);
  t0 = Math.max(0, Math.min(1, t0));
  t1 = Math.max(0, Math.min(1, t1));
  if (t1 <= t0) return 0;
  return (t1 - t0) * Math.sqrt(len2);
}

export function geometryAudit(name, html) {
  const vb = html.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!vb) return [];
  const W = Number(vb[1]),
    H = Number(vb[2]);
  const issues = [];
  const cs = circles(html);
  const ls = lines(html);

  // hollow-pierce: a line crossing more than a hair of a hollow ring's interior
  for (const c of cs.filter((c) => c.hollow)) {
    for (const seg of ls) {
      const chord = chordInsideDisk(seg, c);
      if (chord > c.r * 0.4) {
        issues.push(
          `${name}: LINE-THROUGH-HOLLOW circle (${c.cx},${c.cy}) r${c.r} — visible chord ${chord.toFixed(2)} inside the ring (connector should stop at the edge)`,
        );
      }
    }
  }

  // filled marks escaping viewBox (r included)
  for (const c of cs.filter((c) => !c.hollow)) {
    if (c.cx - c.r < -0.3 || c.cx + c.r > W + 0.3 || c.cy - c.r < -0.3 || c.cy + c.r > H + 0.3) {
      issues.push(`${name}: MARK-ESCAPE circle (${c.cx},${c.cy}) r${c.r} vb ${W}x${H}`);
    }
  }

  return issues;
}
