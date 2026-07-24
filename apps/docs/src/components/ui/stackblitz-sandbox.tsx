"use client";

import { useEffect, useRef, useState } from "react";
import { Play, ArrowUpRight, Loader2 } from "lucide-react";
import {
  STARTER_DESCRIPTION,
  STARTER_FILES,
  STARTER_OPEN_FILE,
  STARTER_TITLE,
} from "@/lib/sandbox/starter";

/**
 * Live "try it" sandbox. Repo-controlled files (see lib/sandbox/starter.ts) are
 * handed to StackBlitz at click time — no hosted personal project to drift, and
 * nothing loads until the reader opts in: `@stackblitz/sdk` is dynamically
 * imported inside the click handler, so the idle card costs zero external JS.
 *
 * StackBlitz's WebContainer runtime (the Vite/node project) only runs *inline*
 * when the host page is cross-origin isolated (COOP + COEP). The deployed site
 * sets those headers on this one route; anywhere they're absent — local
 * `next dev` (static export can't emit headers), a plain file host, Safari —
 * `crossOriginIsolated` is false, so "Run" opens the full editor in a new tab
 * (stackblitz.com is always isolated) instead of showing the broken embed
 * panel. Same project, same bytes, just not framed in place.
 */

const EMBED_HEIGHT = 560;

function project() {
  return {
    title: STARTER_TITLE,
    description: STARTER_DESCRIPTION,
    template: "node" as const,
    files: STARTER_FILES,
  };
}

async function sdk() {
  return (await import("@stackblitz/sdk")).default;
}

function openFull() {
  void sdk()
    .then((s) => s.openProject(project(), { openFile: STARTER_OPEN_FILE, newWindow: true }))
    .catch(() => {
      /* offline — nothing to open */
    });
}

export function StackBlitzSandbox() {
  const host = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "booting" | "live">("idle");
  // null until mounted; then whether inline WebContainers can run here.
  const [canEmbed, setCanEmbed] = useState<boolean | null>(null);

  useEffect(() => {
    setCanEmbed(typeof window !== "undefined" && window.crossOriginIsolated === true);
  }, []);

  const run = async () => {
    if (!host.current || state !== "idle") return;
    // Not isolated → inline WebContainer can't boot. Open the full editor in a
    // new tab rather than render StackBlitz's "Unable to run" panel.
    if (!window.crossOriginIsolated) {
      openFull();
      return;
    }
    setState("booting");
    try {
      const s = await sdk();
      await s.embedProject(host.current, project(), {
        openFile: STARTER_OPEN_FILE,
        view: "preview",
        height: EMBED_HEIGHT,
        hideExplorer: false,
        hideNavigation: true,
        terminalHeight: 0,
      });
      setState("live");
    } catch {
      setState("idle");
      openFull();
    }
  };

  // Before mount we can't know isolation, so present the always-works verb;
  // once mounted-and-isolated, promote the inline "Run".
  const inline = canEmbed === true;

  return (
    <div className="sandbox not-prose" data-state={state}>
      {state === "live" ? null : (
        <div className="sandbox-poster">
          <p className="mono-label text-fd-primary">Live · full app, in the browser</p>
          <p className="sandbox-copy">
            A full Vite + React app with <code>@microcharts/react</code> installed — static and
            interactive charts, inline and block, four themes. No local setup.
          </p>
          <div className="sandbox-actions">
            <button
              type="button"
              className="cta-accent group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:-translate-y-0.5 disabled:opacity-70"
              onClick={() => void run()}
              disabled={state === "booting"}
            >
              {state === "booting" ? (
                <>
                  <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                  Booting…
                </>
              ) : inline ? (
                <>
                  <Play className="size-4" aria-hidden />
                  Run this example
                </>
              ) : (
                <>
                  Open live editor
                  <ArrowUpRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </>
              )}
            </button>
            {inline ? (
              <button
                type="button"
                className="cta-ghost group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
                onClick={openFull}
              >
                Open in StackBlitz
                <ArrowUpRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </button>
            ) : null}
          </div>
        </div>
      )}
      {/* The SDK replaces this node with its iframe on embed. Collapsed until
          the iframe is live so a boot never opens an empty reserved gap — the
          iframe carries its own height (StackBlitz shows its boot UI inside). */}
      <div
        ref={host}
        className="sandbox-frame"
        style={{ minHeight: state === "live" ? EMBED_HEIGHT : 0 }}
      />
    </div>
  );
}
