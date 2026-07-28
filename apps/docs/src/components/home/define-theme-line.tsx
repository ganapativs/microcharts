"use client";
import { useEffect, useState } from "react";
import { ACCENTS } from "@/lib/token-export";
import { CodeTokens } from "@/components/code-tokens";

/**
 * The one line of `defineTheme` the section is about, printed with the accent the
 * page is actually wearing: the paragraph above claims the masthead control runs
 * this function live, and a hardcoded hex would make that false the moment a
 * reader picks a different accent. The value is read off the resolved
 * `--mc-accent` and re-read whenever the accent or theme attribute changes.
 *
 * Server render is the default from the token source, so the line is complete
 * before any JS runs — it is refined on the client, never revealed by it.
 */
export function DefineThemeLine() {
  const [hex, setHex] = useState(ACCENTS[0]!.light);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const v = getComputedStyle(root).getPropertyValue("--mc-accent").trim();
      // Presets pin the accent to a var (mono uses `--mc-stroke`); only take a
      // literal colour, and never print an empty string.
      if (v && v.startsWith("#")) setHex(v);
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributeFilter: ["data-accent", "data-mc-preset", "class"] });
    return () => mo.disconnect();
  }, []);

  return (
    // `max-w-full` + `overflow-x-auto`: a `pre` does not wrap and an
    // `inline-block` one has no width to be bounded by, so on a 360px phone this
    // one line pushed the whole document 14px wider than the viewport.
    <pre
      tabIndex={0}
      className="code mt-6 inline-block max-w-full overflow-x-auto px-4 py-3 leading-none"
    >
      <CodeTokens code={'defineTheme({ accent: "'} />
      <span style={{ color: "var(--mc-accent)" }}>{hex}</span>
      <CodeTokens code={'" })'} />
    </pre>
  );
}
