/**
 * The canonical "try it live" starter, as a repo-controlled file map — the
 * single source of truth for the StackBlitz sandbox. Version-controlled on
 * purpose: a hosted personal StackBlitz project would be mutable state outside
 * the repo (it could drift or vanish with no CI signal), so instead the files
 * live here and are handed to StackBlitz at click time. `@stackblitz/sdk`
 * spins up an ephemeral WebContainer from exactly these bytes.
 *
 * The App.tsx below is the one verified rendering in a real WebContainer:
 * static + interactive, inline + block, four presets, and a dark surface.
 * Toolchain versions mirror StackBlitz's own vite-react-ts template (known-good
 * in the container); @microcharts/react is pinned to the published major.
 */

const APP_TSX = `import { Sparkline } from "@microcharts/react/sparkline";
import { Sparkline as SparklineLive } from "@microcharts/react/sparkline/interactive";
import { SparkBar } from "@microcharts/react/sparkbar";
import { Delta } from "@microcharts/react/delta";
import { Bullet } from "@microcharts/react/bullet";
import "@microcharts/react/styles.css";

const revenue = [12, 18, 15, 22, 19, 27, 24, 31];
const deploys = [4, 6, 2, 8, 5, 9, 3, 7];
const latency = [42, 38, 45, 40, 36, 34, 33, 31];

const chip = {
  background: "#f4f4f5",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: "0.9em",
} as const;

const card = {
  border: "1px solid #ececec",
  borderRadius: 12,
  padding: 20,
} as const;

const eyebrow = {
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#8a8986",
  fontWeight: 600,
  margin: "0 0 10px",
} as const;

function Preset({ name, label }: { name?: string; label: string }) {
  return (
    <div data-mc-theme={name} style={{ textAlign: "center" }}>
      <Sparkline data={revenue} width={110} height={30} dots="minmax" summary={false} />
      <div style={{ marginTop: 6, fontSize: 11, color: "#8a8986" }}>{label}</div>
    </div>
  );
}

export default function App() {
  return (
    <main
      style={{
        maxWidth: 620,
        margin: "0 auto",
        padding: "72px 24px 96px",
        fontFamily: "system-ui, sans-serif",
        color: "#1a1a1a",
        lineHeight: 1.65,
      }}
    >
      <p
        style={{
          fontSize: 12,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#0e7a5f",
          fontWeight: 600,
          margin: 0,
        }}
      >
        @microcharts/react
      </p>
      <h1 style={{ fontSize: 34, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "12px 0 20px" }}>
        Charts small enough to live in a sentence.
      </h1>

      {/* Static, inline — the mark sits in the prose */}
      <p style={{ fontSize: 18 }}>
        Revenue climbed through the quarter{" "}
        <span className="mc-inline">
          <Sparkline data={revenue} width={60} height={20} summary={false} />
        </span>{" "}
        and closed{" "}
        <span className="mc-inline">
          <Delta value={0.184} summary={false} />
        </span>{" "}
        ahead of plan.
      </p>

      {/* Interactive, block — hover or arrow-key to scrub */}
      <section style={{ ...card, margin: "28px 0" }}>
        <p style={eyebrow}>Interactive · hover or arrow-key to scrub</p>
        <SparklineLive
          data={latency}
          width={540}
          height={52}
          dots="minmax"
          band={[30, 46]}
          title="P95 latency (ms)"
          style={{ width: "100%" }}
        />
      </section>

      {/* Static, block — a small KPI row */}
      <div
        style={{
          ...card,
          display: "grid",
          gap: 20,
          gridTemplateColumns: "1fr 1fr",
          margin: "28px 0",
        }}
      >
        <div>
          <p style={eyebrow}>Deploys / day</p>
          <SparkBar data={deploys} width={130} height={30} title="Deploys per day" />
        </div>
        <div>
          <p style={eyebrow}>Quota attainment</p>
          <Bullet value={72} target={80} bands={[50, 90]} width={150} height={30} title="Quota" />
        </div>
      </div>

      {/* Theming — one chart, four looks (data-mc-theme presets) */}
      <section style={{ ...card, margin: "28px 0" }}>
        <p style={eyebrow}>One chart, four presets · data-mc-theme</p>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(4, 1fr)" }}>
          <Preset label="modern" />
          <Preset name="editorial" label="editorial" />
          <Preset name="vivid" label="vivid" />
          <Preset name="mono" label="mono" />
        </div>
      </section>

      {/* Dark surface — the same inline marks, hand-tuned dark twins */}
      <div
        data-mc-theme="dark"
        style={{
          background: "#0a0b0f",
          color: "#e6e7ea",
          borderRadius: 12,
          padding: "18px 20px",
          fontSize: 15,
        }}
      >
        In dark, the same sentence holds{" "}
        <span className="mc-inline">
          <Sparkline data={revenue} width={54} height={18} summary={false} />
        </span>{" "}
        <span className="mc-inline">
          <Delta value={-0.08} summary={false} />
        </span>{" "}
        — valence hues never move.
      </div>

      <p style={{ fontSize: 15, color: "#555", marginTop: 28 }}>
        Edit <code style={chip}>src/App.tsx</code>. Every chart renders from <code style={chip}>data</code>{" "}
        alone and writes its own accessible summary; the default import is server-safe SVG, and{" "}
        <code style={chip}>/interactive</code> adds hover, keyboard, and touch.
      </p>
    </main>
  );
}
`;

const MAIN_TSX = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;

const INDEX_CSS = `:root { color-scheme: light; --mc-font: system-ui, -apple-system, sans-serif; }
* { box-sizing: border-box; }
body { margin: 0; background: #ffffff; }
`;

const INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>microcharts starter</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const VITE_CONFIG = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({ plugins: [react()] });
`;

const TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
`;

// Versions mirror StackBlitz's vite-react-ts template (verified in-container);
// @microcharts/react tracks the published major.
const PACKAGE_JSON = `{
  "name": "microcharts-starter",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@microcharts/react": "^0.8.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^6.0.0",
    "typescript": "~6.0.0",
    "vite": "^8.1.0"
  }
}
`;

export const STARTER_TITLE = "microcharts — live starter";
export const STARTER_DESCRIPTION =
  "Word-sized React charts: static + interactive, inline + block, four themes. Edit src/App.tsx.";

/** The file the sandbox opens and the reader edits first. */
export const STARTER_OPEN_FILE = "src/App.tsx";

/** Complete Vite + React + TS project, ready for a WebContainer. */
export const STARTER_FILES: Record<string, string> = {
  "package.json": PACKAGE_JSON,
  "index.html": INDEX_HTML,
  "vite.config.ts": VITE_CONFIG,
  "tsconfig.json": TSCONFIG,
  "src/main.tsx": MAIN_TSX,
  "src/App.tsx": APP_TSX,
  "src/index.css": INDEX_CSS,
};
