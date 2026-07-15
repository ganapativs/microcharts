"use client";
import { useEffect, useRef } from "react";

/**
 * "Silk" — a slow domain-warped fbm gradient in periwinkle / lilac / ice over
 * paper. Hand-written WebGL1, no deps. DPR capped at 1.5; rAF pauses when the
 * hero is off-screen or the tab is hidden; reduced motion renders one settled
 * frame and stops; no-WebGL falls back to the CSS gradient painted behind the
 * canvas (canvas simply stays transparent).
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
 float tt=t*.05;
 vec2 q=vec2(fbm(p+tt*.7),fbm(p+vec2(5.2,1.3)-tt*.5));
 vec2 w=vec2(fbm(p+2.6*q+vec2(1.7,9.2)+tt*.3),fbm(p+2.6*q+vec2(8.3,2.8)-tt*.4));
 float f=fbm(p+2.4*w);
 vec3 col=mix(cP,cA,smoothstep(.12,.6,f));
 col=mix(col,cB,smoothstep(.28,.85,w.x)*.9);
 col=mix(col,cC,smoothstep(.32,.9,q.y)*.75);
 // a silky sheen ridge where the warp folds
 col+=vec3(.05)*smoothstep(.48,.52,f)*(1.-smoothstep(.52,.6,f));
 // lift toward paper at the bottom so copy under the fold sits on calm ground
 col=mix(col,cP,smoothstep(.45,1.,uv.y)*.45);
 gl_FragColor=vec4(col,1.);}`;

/** oklab-ish silk tones tuned for 4.5:1 ink on top. */
const TONES = {
  paper: [0.933, 0.945, 0.968],
  periwinkle: [0.647, 0.706, 0.925],
  lilac: [0.792, 0.733, 0.918],
  ice: [0.725, 0.843, 0.933],
} as const;

export function SilkShader({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl =
      canvas.getContext("webgl", { antialias: false, depth: false, stencil: false }) ??
      canvas.getContext("experimental-webgl");
    if (!(gl instanceof WebGLRenderingContext)) return; // CSS fallback shows through

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
    gl.uniform3fv(gl.getUniformLocation(prog, "cA"), [...TONES.periwinkle]);
    gl.uniform3fv(gl.getUniformLocation(prog, "cB"), [...TONES.lilac]);
    gl.uniform3fv(gl.getUniformLocation(prog, "cC"), [...TONES.ice]);
    gl.uniform3fv(gl.getUniformLocation(prog, "cP"), [...TONES.paper]);

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
    // Reduced motion: one settled frame at a hand-picked time, then stop.
    if (reduced) {
      gl.uniform1f(uT, 40);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return;
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

  return <canvas ref={ref} aria-hidden className={`lab-silk ${className}`} />;
}
