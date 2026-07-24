"use client";

import { ArrowUpRight } from "lucide-react";
import {
  STARTER_DESCRIPTION,
  STARTER_FILES,
  STARTER_OPEN_FILE,
  STARTER_TITLE,
} from "@/lib/sandbox/starter";

/**
 * "Try it live" launcher. Repo-controlled starter files (lib/sandbox/starter.ts)
 * are handed to StackBlitz at click time and opened in a new tab — no hosted
 * project to drift, and nothing loads until the reader opts in (`@stackblitz/sdk`
 * is dynamically imported inside the handler, so the idle card costs zero JS).
 *
 * New tab, not an inline embed, on purpose: StackBlitz's inline WebContainer
 * runs only in a cross-origin-isolated page, and its inline-files (`/run`) frame
 * doesn't send the COEP header such a page demands of an embedded document — so
 * embedding it is `blocked:COEP-frame`. (Sites that embed StackBlitz inline use
 * its github/URL projects, which do carry that header; our starter is inline
 * files.) stackblitz.com is always isolated, so the new tab always works — same
 * project, same bytes.
 */

function project() {
  return {
    title: STARTER_TITLE,
    description: STARTER_DESCRIPTION,
    template: "node" as const,
    files: STARTER_FILES,
  };
}

function openFull() {
  void import("@stackblitz/sdk")
    .then((m) => m.default.openProject(project(), { openFile: STARTER_OPEN_FILE, newWindow: true }))
    .catch(() => {
      /* offline — nothing to open */
    });
}

export function StackBlitzSandbox() {
  return (
    <div className="sandbox not-prose">
      <div className="sandbox-poster">
        <p className="mono-label text-fd-primary">Live · full app, in the browser</p>
        <p className="sandbox-copy">
          A full Vite + React app with <code>@microcharts/react</code> installed — static and
          interactive charts, inline and block, four themes. No local setup.
        </p>
        <div className="sandbox-actions">
          <button
            type="button"
            className="cta-accent group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:-translate-y-0.5"
            onClick={openFull}
          >
            Open in StackBlitz
            <ArrowUpRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </button>
        </div>
      </div>
    </div>
  );
}
