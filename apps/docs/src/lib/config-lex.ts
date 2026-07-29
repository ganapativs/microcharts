/**
 * A tiny config lexer — the JSON/TOML/YAML/shell sibling of `jsx-lex.ts`, and
 * for the same reason: the MCP setup list renders ~30 short blocks, and running
 * a full highlighter over them would ship a syntax engine to the client for
 * text that never changes.
 *
 * It recognises five things: a comment, a quoted string, a key, a number or
 * boolean, and the leading word of a shell command. Everything else is plain
 * ink, so anything it doesn't understand renders uncoloured rather than wrong.
 * The `tok-*` classes are the ones `jsx-lex` already uses, so config blocks and
 * JSX snippets share one palette.
 */
import type { Tok } from "./jsx-lex.ts";

export type ConfigLang = "bash" | "json" | "toml" | "yaml" | "text";

const TOK_RE = /(#[^\n]*|"[^"]*"|\[[^\]\n]+\]|--?[A-Za-z][\w-]*|[\w@./-]+|\s+|.)/g;

/** Is `s` a bare token that reads as data rather than structure? */
const isNumber = (s: string) => /^-?\d+(?:\.\d+)?$/.test(s) || s === "true" || s === "false";

export function lexConfig(code: string, lang: ConfigLang): Tok[] {
  const out: Tok[] = [];
  if (lang === "text") return [{ text: code, at: 0 }];

  for (const m of code.matchAll(TOK_RE)) {
    const t = m[0];
    const at = m.index ?? 0;
    const rest = code.slice(at + t.length);
    /** The next non-space character — what decides key vs value. */
    const next = /^\s*(\S)/.exec(rest)?.[1];
    /** Everything before this token on its line, for "is this the command?" */
    const before = code.slice(0, at);
    const lineHead = before.slice(before.lastIndexOf("\n") + 1);

    let cls: string | undefined;
    if (t.startsWith("#")) cls = "tok-attr";
    else if (t.startsWith("[") && lang === "toml") cls = "tok-tag";
    else if (t.startsWith('"')) cls = next === ":" || next === "=" ? "tok-attr" : "tok-str";
    else if (t.startsWith("-") && lang === "bash") cls = "tok-attr";
    else if (isNumber(t)) cls = "tok-num";
    else if (/^[\w@./-]/.test(t)) {
      if (lang === "bash") cls = lineHead.trim() === "" ? "tok-tag" : undefined;
      else if (next === ":" || next === "=") cls = "tok-attr";
      else if (lang === "yaml" || lang === "toml") cls = "tok-str";
    }

    // Merge runs of uncoloured characters so we don't emit a span per token.
    if (!cls && out.length && !out[out.length - 1]!.cls) {
      const prev = out[out.length - 1]!;
      out[out.length - 1] = { text: prev.text + t, at: prev.at };
      continue;
    }
    out.push(cls ? { text: t, cls, at } : { text: t, at });
  }
  return out;
}
