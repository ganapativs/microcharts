"use client";
import { useEffect, useRef } from "react";

/**
 * Hero backdrop — a live field of drifting "signal" waves, like a dozen faint
 * sparklines breathing behind the page. Zero-dep raw WebGL; theme- and
 * accent-aware (reads --accent / foreground live); calm and non-distracting;
 * freezes to a static frame under prefers-reduced-motion; pauses off-screen.
 * Degrades to nothing if WebGL is unavailable.
 */
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uAccent;
uniform vec3 uInk;
uniform float uDark;

float hash(float n){ return fract(sin(n)*43758.5453123); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  float a=hash(i.x+i.y*57.0);
  float b=hash(i.x+1.0+i.y*57.0);
  float c=hash(i.x+(i.y+1.0)*57.0);
  float d=hash(i.x+1.0+(i.y+1.0)*57.0);
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float t = uTime * 0.05;
  float line = 0.0;
  vec3 col = vec3(0.0);
  for(int i=0;i<6;i++){
    float fi = float(i);
    float base = 0.18 + fi*0.115;
    float freq = 1.8 + fi*0.75;
    float speed = 0.18 + fi*0.10;
    float amp = 0.045 + fi*0.011;
    float n = noise(vec2(uv.x*2.2 + fi*13.0, t*0.6 + fi)) * 0.055;
    float wy = base + sin(uv.x*freq + t*speed*6.2831 + fi*1.7)*amp + n;
    float d = abs(uv.y - wy);
    float core = smoothstep(0.0075, 0.0, d);
    float glow = smoothstep(0.055, 0.0, d) * 0.32;
    float li = core + glow;
    vec3 lc = mix(uInk, uAccent, 0.30 + fi*0.12);
    col += lc * li;
    line += li;
  }
  vec3 outc = col / max(line, 0.001);
  float mx = smoothstep(0.0,0.16,uv.x) * smoothstep(1.0,0.80,uv.x);
  float my = smoothstep(0.0,0.20,uv.y) * smoothstep(1.0,0.62,uv.y);
  float a = clamp(line,0.0,1.0) * mx * my * (uDark>0.5 ? 0.60 : 0.40);
  gl_FragColor = vec4(outc, a);
}`;

const VERT = `
attribute vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

function readRGB(name: string, fallback: [number, number, number]): [number, number, number] {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const hex = v.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const rgb = v.match(/(\d+(?:\.\d+)?)/g);
  if (rgb && rgb.length >= 3) return [+rgb[0] / 255, +rgb[1] / 255, +rgb[2] / 255];
  return fallback;
}

export function HeroShader({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
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

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uAccent = gl.getUniformLocation(prog, "uAccent");
    const uInk = gl.getUniformLocation(prog, "uInk");
    const uDark = gl.getUniformLocation(prog, "uDark");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let dark = document.documentElement.classList.contains("dark");
    const syncColors = () => {
      dark = document.documentElement.classList.contains("dark");
      const acc = readRGB("--accent", [0.19, 0.32, 0.83]);
      const ink = readRGB("--color-fd-foreground", dark ? [0.9, 0.9, 0.88] : [0.1, 0.09, 0.07]);
      gl.uniform3f(uAccent, acc[0], acc[1], acc[2]);
      gl.uniform3f(uInk, ink[0], ink[1], ink[2]);
      gl.uniform1f(uDark, dark ? 1 : 0);
    };
    syncColors();

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const resize = () => {
      const w = canvas.clientWidth,
        h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const mo = new MutationObserver(syncColors);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-accent"],
    });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !reduce && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);

    const start = performance.now();
    function frame() {
      raf = 0;
      const t = (performance.now() - start) / 1000;
      gl!.uniform1f(uTime, t);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      if (visible && !reduce) raf = requestAnimationFrame(frame);
    }
    if (reduce) {
      gl.uniform1f(uTime, 12);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      io.disconnect();
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
