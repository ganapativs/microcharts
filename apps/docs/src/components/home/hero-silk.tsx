"use client";
import { useEffect, useRef } from "react";

/**
 * Hero silk — a slow domain-warped fbm gradient behind the fold. Hand-written
 * WebGL1, zero deps, ~2 kB. The silk tones are DERIVED from the live `--accent`
 * (so the picker recolours it, not just cobalt) as a ±30° hue sweep at a fixed
 * lightness/saturation profile per theme — reproducing the original periwinkle
 * → lilac → ice sweep when the accent is cobalt, and rotating it for ember,
 * moss, teal, rose, etc. Retunes live on accent/theme change. DPR capped at
 * 1.5; rAF pauses off-screen and in hidden tabs; reduced motion renders one
 * settled frame; no-WebGL leaves the CSS fallback gradient showing through.
 */

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `precision highp float;
uniform vec2 r;uniform float t;uniform vec3 cA,cB,cC,cP;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;
 for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,-1.3);a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/r;vec2 p=uv*vec2(r.x/r.y,1.)*1.6;
 float tt=t*.045;
 vec2 q=vec2(fbm(p+tt*.7),fbm(p+vec2(5.2,1.3)-tt*.5));
 vec2 w=vec2(fbm(p+2.6*q+vec2(1.7,9.2)+tt*.3),fbm(p+2.6*q+vec2(8.3,2.8)-tt*.4));
 float f=fbm(p+2.4*w);
 vec3 col=mix(cP,cA,smoothstep(.12,.6,f));
 col=mix(col,cB,smoothstep(.28,.85,w.x)*.9);
 col=mix(col,cC,smoothstep(.32,.9,q.y)*.75);
 // settle to the page field at the bottom so copy below sits on calm ground
 col=mix(col,cP,smoothstep(.4,1.,uv.y)*.7);
 gl_FragColor=vec4(col,1.);}`;

interface ToneSet {
  paper: readonly number[];
  a: readonly number[];
  b: readonly number[];
  c: readonly number[];
}

// [hueOffset°, saturation, lightness] per silk band, per theme. The offsets +
// S/L reproduce the original cobalt periwinkle/lilac/ice sweep; keeping them
// fixed and only rotating the hue to the accent preserves the look for any
// accent. Paper stays the neutral field colour so copy contrast never drifts.
const PROFILE = {
  light: {
    paper: [0.933, 0.945, 0.968] as const,
    a: [0, 0.62, 0.81],
    b: [30, 0.52, 0.84],
    c: [-21, 0.59, 0.85],
  },
  dark: {
    paper: [0.039, 0.043, 0.059] as const,
    a: [0, 0.42, 0.22],
    b: [26, 0.34, 0.21],
    c: [-19, 0.44, 0.18],
  },
} as const;

/** Resolve any CSS colour string to [r,g,b] 0..1 via the browser (handles hex,
 *  rgb(), oklch(), named — whatever the accent token holds). */
function resolveRgb(colorStr: string): [number, number, number] {
  const el = document.createElement("span");
  el.style.cssText = "color:" + colorStr + ";display:none";
  document.body.appendChild(el);
  const m = getComputedStyle(el).color.match(/[\d.]+/g);
  el.remove();
  return m ? [+m[0] / 255, +m[1] / 255, +m[2] / 255] : [0.184, 0.322, 0.831];
}

function rgbToHue([r, g, b]: readonly number[]): number {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  let hue: number;
  if (max === r) hue = ((g - b) / d) % 6;
  else if (max === g) hue = (b - r) / d + 2;
  else hue = (r - g) / d + 4;
  hue *= 60;
  return hue < 0 ? hue + 360 : hue;
}

function hslToRgb(h: number, s: number, l: number): number[] {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return [r + m, g + m, b + m];
}

/** Read the live `--accent` + theme, build the silk tone set. */
function readTones(): ToneSet {
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  const hue = rgbToHue(resolveRgb(accent || "#c2410c"));
  const P = document.documentElement.classList.contains("dark") ? PROFILE.dark : PROFILE.light;
  const tone = ([dh, s, l]: readonly number[]) => hslToRgb(hue + dh, s, l);
  return { paper: P.paper, a: tone(P.a), b: tone(P.b), c: tone(P.c) };
}

export function HeroSilk({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, depth: false, stencil: false });
    if (!(gl instanceof WebGLRenderingContext)) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uR = gl.getUniformLocation(prog, "r");
    const uT = gl.getUniformLocation(prog, "t");
    const applyTones = () => {
      const tones = readTones();
      gl.uniform3fv(gl.getUniformLocation(prog, "cA"), [...tones.a]);
      gl.uniform3fv(gl.getUniformLocation(prog, "cB"), [...tones.b]);
      gl.uniform3fv(gl.getUniformLocation(prog, "cC"), [...tones.c]);
      gl.uniform3fv(gl.getUniformLocation(prog, "cP"), [...tones.paper]);
    };
    applyTones();

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      const w = Math.round(canvas.clientWidth * dpr);
      const hgt = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== hgt) {
        canvas.width = w;
        canvas.height = hgt;
        gl.viewport(0, 0, w, hgt);
      }
      gl.uniform2f(uR, canvas.width, canvas.height);
    };
    resize();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    const t0 = performance.now();
    // Retune the palette when the accent picker or theme class changes.
    const mo = new MutationObserver(() => {
      applyTones();
      if (reduced || !visible || document.visibilityState !== "visible") {
        resize();
        gl.drawArrays(gl.TRIANGLES, 0, 3); // paused: force a single repaint
      }
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-accent"],
    });

    // Flip [data-ready] once, after the first frame has actually painted, so
    // CSS can cross-fade the shader up over the grid + fallback ground.
    let ready = false;
    const markReady = () => {
      if (ready) return;
      ready = true;
      canvas.dataset.ready = "";
    };

    const frame = () => {
      resize();
      gl.uniform1f(uT, (performance.now() - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      markReady();
      if (!reduced && visible && document.visibilityState === "visible") {
        raf = requestAnimationFrame(frame);
      }
    };
    if (reduced) {
      gl.uniform1f(uT, 40);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      markReady();
      const ro = new ResizeObserver(() => {
        resize();
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      });
      ro.observe(canvas);
      return () => {
        ro.disconnect();
        mo.disconnect();
      };
    }
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(frame);
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);
    const onVis = () => {
      if (document.visibilityState === "visible" && visible) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={`hv-silk ${className}`} />;
}
