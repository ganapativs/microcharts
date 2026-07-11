import { cn } from "@/lib/cn";

/**
 * Shell install commands render as plain foreground text everywhere they appear
 * (install pill, package tabs, brand sheet, usage footnote). This tokenizes one
 * into its shell parts so the binary, verb, flags, and package read distinctly —
 * the same restrained two-tone the fenced ```bash blocks get from Shiki, but for
 * our custom command wells that aren't real code fences.
 */

const BINARIES = new Set(["pnpm", "npm", "yarn", "bun", "npx", "pnpx", "bunx", "deno"]);
const VERBS = new Set([
  "add",
  "install",
  "i",
  "create",
  "dlx",
  "exec",
  "run",
  "x",
  "remove",
  "rm",
  "up",
  "update",
]);

type Kind = "bin" | "verb" | "flag" | "pkg" | "space";
export type CommandToken = { kind: Kind; value: string };

/** Split a command into shell tokens, preserving whitespace so spacing is exact. */
export function tokenizeCommand(command: string): CommandToken[] {
  return command.split(/(\s+)/).flatMap((part): CommandToken[] => {
    if (part.length === 0) return [];
    if (/^\s+$/.test(part)) return [{ kind: "space", value: part }];
    if (BINARIES.has(part)) return [{ kind: "bin", value: part }];
    if (VERBS.has(part)) return [{ kind: "verb", value: part }];
    if (part.startsWith("-")) return [{ kind: "flag", value: part }];
    return [{ kind: "pkg", value: part }];
  });
}

// The binary anchors (full-strength foreground), the package is the payload the
// eye should land on (accent), verbs + flags stay quiet. `dim` tones the whole
// line down for demoted footnote contexts without losing the token structure.
const TOKEN_CLASS: Record<Exclude<Kind, "space">, [string, string]> = {
  bin: ["text-fd-foreground", "text-fd-foreground/80"],
  verb: ["text-fd-muted-foreground", "text-fd-muted-foreground"],
  flag: ["text-fd-muted-foreground", "text-fd-muted-foreground"],
  pkg: ["text-fd-primary", "text-fd-primary/75"],
};

export function CommandLine({
  command,
  prompt = true,
  dim = false,
  className,
}: {
  command: string;
  /** Show the leading `$` prompt (accent, decorative). */
  prompt?: boolean;
  /** Tone the whole line down for demoted contexts. */
  dim?: boolean;
  className?: string;
}) {
  const tone = dim ? 1 : 0;
  return (
    <code className={cn("font-mono", className)}>
      {prompt && (
        <span aria-hidden className="mr-2 select-none text-fd-primary">
          $
        </span>
      )}
      {tokenizeCommand(command).map((tok, i) =>
        tok.kind === "space" ? (
          tok.value
        ) : (
          <span key={i} className={TOKEN_CLASS[tok.kind][tone]}>
            {tok.value}
          </span>
        ),
      )}
    </code>
  );
}
