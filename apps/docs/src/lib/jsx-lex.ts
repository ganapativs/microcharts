/**
 * A tiny JSX lexer — enough colour for the snippets this site shows, and zero
 * dependencies, which is the whole point of a library that ships none.
 *
 * It is deliberately not a parser. It recognises four things: a component tag, an
 * attribute name, a string literal and a number. Everything else is plain ink.
 * That is the exact set the code on the marketing pages needs, and it degrades to
 * "uncoloured but correct" on anything more complicated rather than mis-colouring
 * it. The token classes (`hv-tok-*`) live in global.css and ride the theme, so a
 * preset or accent change moves the syntax colours with everything else.
 *
 * Shared by the current home page's grammar demo and the v3 candidate's code
 * surfaces. One lexer, one look — a second copy is how two pages on one site end
 * up with two different ideas of what a string literal looks like.
 */

export interface Tok {
  text: string;
  cls?: string;
  /** Byte offset in the source string — a stable, data-derived React key. */
  at: number;
}

const TOK_RE = /(<\/?[A-Z]\w*|\/>|>|[A-Za-z][\w-]*|"[^"]*"|-?\d+(?:\.\d+)?|\s+|.)/g;

export function lexJsx(code: string): Tok[] {
  const out: Tok[] = [];
  for (const m of code.matchAll(TOK_RE)) {
    const t = m[0];
    let cls: string | undefined;
    if (/^<\/?[A-Z]/.test(t) || t === "/>" || t === ">") cls = "hv-tok-tag";
    else if (/^[A-Za-z]/.test(t) && code[(m.index ?? 0) + t.length] === "=") cls = "hv-tok-attr";
    else if (t.startsWith('"')) cls = "hv-tok-str";
    else if (/^-?\d/.test(t)) cls = "hv-tok-num";
    // Merge runs of uncoloured characters so we don't emit a span per character.
    const at = m.index ?? 0;
    if (!cls && out.length && !out[out.length - 1]!.cls) {
      const prev = out[out.length - 1]!;
      out[out.length - 1] = { text: prev.text + t, at: prev.at };
      continue;
    }
    out.push(cls ? { text: t, cls, at } : { text: t, at });
  }
  return out;
}
