"use client";
import { useEffect, useState } from "react";
import { ACCENTS } from "@/lib/token-export";
import { CodeTokens } from "@/components/code-tokens";

/**
 * The `defineTheme` call the bench above it is currently making, printed as code.
 *
 * It is not decoration and it is not a fixed snippet: the two controls write
 * `data-accent` and `data-mc-preset` on `<html>`, and this reads those two
 * attributes back, so the line is always the call that produced the marks beside
 * it. Copy it into a project and the same tokens come out.
 *
 * Which shape it prints follows `deriveCatPalette`, the one function the picker,
 * the token studio and the site's baked CSS all resolve through:
 *
 *   modern            `defineTheme({ accent })`
 *   editorial, vivid  `defineTheme({ extends, accent })`
 *   mono, print, eink `defineTheme({ extends })` — these own their whole ink set,
 *                     so an accent seed would be a value the library ignores.
 *
 * The seed is the accent's LIGHT hex in both modes, because that is the argument
 * `defineTheme` takes; the dark twins are its output, not its input.
 *
 * Server render is the site default, so the line is complete before any JS runs.
 * It is refined on the client, never revealed by it.
 */

/** Presets that own `--mc-accent` outright, so no seed is passed with them. */
const OWNS_INK = new Set(["mono", "print", "eink"]);

export function DefineThemeLine() {
  const [accent, setAccent] = useState("cobalt");
  const [preset, setPreset] = useState("modern");

  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      setAccent(root.dataset.accent ?? "cobalt");
      setPreset(root.dataset.mcPreset ?? "modern");
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributeFilter: ["data-accent", "data-mc-preset"] });
    return () => mo.disconnect();
  }, []);

  const hex = (ACCENTS.find((a) => a.id === accent) ?? ACCENTS[0]!).light;
  const extend = preset === "modern" ? null : preset;
  const seeded = !OWNS_INK.has(preset);

  return (
    // `max-w-full` + `overflow-x-auto`: a `pre` does not wrap and an
    // `inline-block` one has no width to be bounded by, so on a 360px phone this
    // one line pushed the whole document 14px wider than the viewport.
    <pre
      tabIndex={0}
      className="code mt-6 inline-block max-w-full overflow-x-auto px-4 py-3 leading-none"
    >
      <CodeTokens code="defineTheme({ " />
      {extend ? <CodeTokens code={`extends: "${extend}"${seeded ? ", " : ""}`} /> : null}
      {seeded ? (
        <>
          <CodeTokens code={'accent: "'} />
          <span style={{ color: "var(--mc-accent)" }}>{hex}</span>
          <CodeTokens code={'"'} />
        </>
      ) : null}
      <CodeTokens code=" })" />
    </pre>
  );
}
