"use client";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

/**
 * Hero silk — a slow domain-warped fbm gradient behind the fold. Hand-written
 * WebGL1, zero deps, ~2 kB. Theme-aware tone sets (hand-tuned dark, never an
 * inverted filter); DPR capped at 1.5; rAF pauses off-screen and in hidden
 * tabs; reduced motion renders one settled frame; no-WebGL leaves the CSS
 * fallback gradient showing through.
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

/** Tone sets per theme — dark is tuned, not filtered. */
interface ToneSet {
  paper: readonly number[];
  a: readonly number[];
  b: readonly number[];
  c: readonly number[];
}
const TONES: Record<"light" | "dark", ToneSet> = {
  light: {
    paper: [0.933, 0.945, 0.968],
    a: [0.694, 0.745, 0.933], // periwinkle
    b: [0.812, 0.761, 0.925], // lilac
    c: [0.757, 0.859, 0.937], // ice
  },
  dark: {
    paper: [0.039, 0.043, 0.059], // the dark field #0a0b0f
    a: [0.137, 0.169, 0.322], // deep periwinkle
    b: [0.192, 0.157, 0.302], // deep lilac
    c: [0.106, 0.184, 0.271], // deep ice
  },
} as const;

export function HeroSilk({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const toneRef = useRef<((tones: ToneSet) => void) | null>(null);

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
    const setTones = (tones: ToneSet) => {
      gl.uniform3fv(gl.getUniformLocation(prog, "cA"), [...tones.a]);
      gl.uniform3fv(gl.getUniformLocation(prog, "cB"), [...tones.b]);
      gl.uniform3fv(gl.getUniformLocation(prog, "cC"), [...tones.c]);
      gl.uniform3fv(gl.getUniformLocation(prog, "cP"), [...tones.paper]);
    };
    toneRef.current = setTones;
    setTones(document.documentElement.classList.contains("dark") ? TONES.dark : TONES.light);

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
    const frame = () => {
      resize();
      gl.uniform1f(uT, (performance.now() - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduced && visible && document.visibilityState === "visible") {
        raf = requestAnimationFrame(frame);
      }
    };
    if (reduced) {
      gl.uniform1f(uT, 40);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      // still repaint on theme change / resize
      const ro = new ResizeObserver(() => {
        resize();
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      });
      ro.observe(canvas);
      toneRef.current = (tones) => {
        setTones(tones);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      return () => ro.disconnect();
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
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // retune tones when the site theme flips
  useEffect(() => {
    toneRef.current?.(resolvedTheme === "dark" ? TONES.dark : TONES.light);
  }, [resolvedTheme]);

  return <canvas ref={ref} aria-hidden className={`hv-silk ${className}`} />;
}
