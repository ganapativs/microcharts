"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { SEMANTIC_TOKENS, CATEGORICAL_TOKENS, PRESETS, type ColorToken } from "@/lib/mc-tokens";

/**
 * Visual reference for the library `--mc-*` colour tokens on the theming page.
 *
 * Each chip paints the LIBRARY value literally (not a live `getComputedStyle`
 * read) because this docs site re-tints the tokens for its own glass surface —
 * a live read would contradict the values documented in the same page. The
 * hexes come from `@/lib/mc-tokens`, kept honest by `mc-tokens.test.ts`.
 */

// A single copyable colour chip: the fill IS the value, hex sits alongside.
function Chip({ value, label, derived }: { value: string; label: string; derived?: boolean }) {
  const [copied, setCopied] = useState(false);
  // Near-white/near-black fills would vanish on the tile — draw a hairline ring.
  const ring = /#(e|f)|#[0-9a-f]{0,2}1[0-9a-f]|inherit/i.test(value);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      aria-label={`Copy ${label} ${value}`}
      className="group/chip flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-fd-border/70 p-1.5 text-left transition-colors hover:border-fd-primary/40"
    >
      <span
        className={cn(
          "relative grid size-7 shrink-0 place-items-center rounded-md",
          ring && "ring-1 ring-inset ring-fd-border",
        )}
        style={{ background: value }}
      >
        <Check
          className={cn(
            "size-3.5 text-white mix-blend-difference transition-opacity",
            copied ? "opacity-100" : "opacity-0",
          )}
        />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="mono-label block text-[0.56rem] uppercase opacity-60">{label}</span>
        <span className="block truncate font-mono text-[0.72rem] tabular-nums text-fd-muted-foreground">
          {copied ? "copied" : derived ? "derived" : value}
        </span>
      </span>
    </button>
  );
}

function TokenRow({ token }: { token: ColorToken }) {
  return (
    <div className="grid grid-cols-[9.5rem_1fr] items-center gap-3 py-1.5">
      <div className="min-w-0 leading-tight">
        <code className="block truncate text-[0.78rem] font-medium text-fd-foreground">
          {token.tone ?? token.cssVar}
        </code>
        <span className="block truncate text-[0.7rem] text-fd-muted-foreground">
          {token.tone ? token.cssVar : token.role}
        </span>
      </div>
      <div className="flex gap-2">
        <Chip value={token.light} label="Light" derived={token.derived} />
        <Chip value={token.dark} label="Dark" derived={token.derived} />
      </div>
    </div>
  );
}

function Group({ title, tokens }: { title: string; tokens: ColorToken[] }) {
  return (
    <div>
      <div className="mono-label mb-1 text-[0.6rem]">{title}</div>
      <div className="divide-y divide-fd-border/50">
        {tokens.map((t) => (
          <TokenRow key={t.cssVar} token={t} />
        ))}
      </div>
    </div>
  );
}

export function TokenSwatches() {
  return (
    <div className="not-prose my-6 grid gap-6 sm:grid-cols-2">
      <Group title="Semantic — meaning is fixed" tokens={SEMANTIC_TOKENS} />
      <Group title="Categorical — multi-series only" tokens={CATEGORICAL_TOKENS} />
    </div>
  );
}

/**
 * Compact companion: what each preset retunes, with a chip for any pinned
 * colour. Mirrors the library preset bundles (see `@/lib/mc-tokens`).
 */
export function PresetDeltas() {
  return (
    <div className="not-prose my-6 grid gap-3 sm:grid-cols-2">
      {PRESETS.map((p) => {
        const colorChange = p.changes.find(
          (c) => c.cssVar === "--mc-accent" && c.value.startsWith("#"),
        );
        return (
          <div key={p.id} className="rounded-xl border border-fd-border/70 p-3.5">
            <div className="mb-1 flex items-center gap-2">
              {colorChange && (
                <span
                  aria-hidden
                  className="size-3.5 shrink-0 rounded-full ring-1 ring-inset ring-fd-border"
                  style={{ background: colorChange.value }}
                />
              )}
              <span className="text-sm font-medium text-fd-foreground">{p.label}</span>
              {p.id === "modern" && (
                <span className="mono-label text-[0.55rem] opacity-60">default</span>
              )}
            </div>
            <p className="mb-2 text-[0.78rem] leading-snug text-fd-muted-foreground">{p.note}</p>
            {p.changes.length > 0 && (
              <ul className="space-y-0.5">
                {p.changes.map((c) => (
                  <li
                    key={c.cssVar}
                    className="font-mono text-[0.7rem] tabular-nums text-fd-muted-foreground"
                  >
                    <span className="text-fd-foreground/80">{c.cssVar}</span>: {c.value}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
