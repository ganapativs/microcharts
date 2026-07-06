"use client";
import { useState } from "react";
import { CopyButton } from "./copy";
import { cn } from "@/lib/cn";

const managers = {
  pnpm: "pnpm add",
  npm: "npm install",
  yarn: "yarn add",
  bun: "bun add",
} as const;

type PM = keyof typeof managers;

/** Install command with package-manager tabs. */
export function PackageTabs({ pkg = "@microcharts/react" }: { pkg?: string }) {
  const [pm, setPm] = useState<PM>("pnpm");
  const command = `${managers[pm]} ${pkg}`;
  return (
    <div className="not-prose my-5 overflow-hidden rounded-lg border border-fd-border bg-fd-card">
      <div className="flex items-center gap-0.5 border-b border-fd-border bg-fd-muted/40 px-1.5 py-1.5">
        {(Object.keys(managers) as PM[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setPm(m)}
            className={cn(
              "rounded px-2.5 py-1 font-mono text-xs transition-colors",
              pm === m
                ? "bg-fd-card text-fd-foreground ring-1 ring-fd-border"
                : "text-fd-muted-foreground hover:text-fd-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <span aria-hidden className="font-mono text-sm text-fd-primary">
          $
        </span>
        <code className="flex-1 font-mono text-sm text-fd-foreground">{command}</code>
        <CopyButton text={command} />
      </div>
    </div>
  );
}
