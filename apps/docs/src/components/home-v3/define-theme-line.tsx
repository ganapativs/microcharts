"use client";
import { useEffect, useState } from "react";
import { ACCENTS } from "@/lib/token-export";
import { CodeTokens } from "@/components/code-tokens";

/**
 * The one line of `defineTheme` the section is about, printed with the accent the
 * page is ACTUALLY wearing.
 *
 * The paragraph above claims the masthead's palette control runs this function
 * live. A hardcoded hex would make that claim false the moment a reader picked a
 * different accent — the swatch beside the line would be teal and the line would
 * still say ember. So the value is read off the resolved `--mc-accent` after
 * mount and re-read whenever the accent or theme attribute changes, which is
 * exactly the surface the popover writes to.
 *
 * Server render is the default (ember) from the token source, so the line is
 * correct and complete before any JS runs — it is only ever *refined* on the
 * client, never revealed by it.
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
    <pre className="code mt-6 inline-block px-4 py-3 leading-none">
      <CodeTokens code={'defineTheme({ accent: "'} />
      <span style={{ color: "var(--mc-accent)" }}>{hex}</span>
      <CodeTokens code={'" })'} />
    </pre>
  );
}
