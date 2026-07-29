"use client";
import { useState } from "react";
import { CopyButton } from "./copy";
import { CommandLine } from "./command-line";

const managers = {
  pnpm: "pnpm add",
  npm: "npm install",
  yarn: "yarn add",
  bun: "bun add",
} as const;

type PM = keyof typeof managers;

/** Install command with package-manager tabs — the shared code-panel language. */
export function PackageTabs({ pkg = "@microcharts/react" }: { pkg?: string }) {
  const [pm, setPm] = useState<PM>("pnpm");
  const command = `${managers[pm]} ${pkg}`;
  return (
    <div className="command-well not-prose my-5 overflow-hidden">
      <div className="flex items-center px-2.5 pb-1 pt-2.5">
        <div className="seg" role="tablist" aria-label="Package manager">
          {(Object.keys(managers) as PM[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={pm === m}
              data-active={pm === m}
              onClick={() => setPm(m)}
              className="seg-opt"
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2.5 pb-2.5 pl-4 pr-2 pt-1">
        <CommandLine command={command} className="min-w-0 flex-1 truncate text-sm" />
        <CopyButton text={command} size={7} className="shrink-0" analyticsKind="install" />
      </div>
    </div>
  );
}
