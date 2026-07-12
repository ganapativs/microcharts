/**
 * Expand the docs' MDX components into plain Markdown for machine surfaces
 * (the `.md` mirrors, `/llms.txt` links, `/llms-full.txt`). Without this, an
 * agent reading those surfaces sees inert tags like `<Snippet id="parse" />` or
 * `<GrammarExplorer />` instead of the actual code and grammar. The same
 * function runs in Next (via `getLLMText`) and in Node (via `scripts/gen-md.ts`),
 * so every surface agrees.
 *
 * It is a best-effort text transform, not a full MDX compiler — it targets the
 * components this site actually uses and strips the purely-visual ones.
 */
import { AI_SNIPPETS } from "./ai-snippets.ts";
import { GRAMMAR } from "./ai-grammar.ts";
import { PROVIDER_GROUPS, MACHINE_SURFACES, AGENT_RULES } from "./ai-providers.ts";
import { AI_LOGOS } from "./ai-logos.ts";

const fence = (lang: string, code: string) => `\`\`\`${lang}\n${code}\n\`\`\``;

function grammarText(): string {
  const rows = GRAMMAR.map(
    (g) =>
      `**${g.label}** — ${g.blurb}\n\n\`\`\`chart ${g.type}\n${g.body}\n\`\`\`\n\nEquivalent React:\n\n${fence("tsx", g.jsx)}`,
  );
  return `The grammar has two forms — a fenced \`chart\` block for a standalone chart, or an inline \`chart <type> <data>\` span inside a sentence. Body is whitespace/comma numbers, or key=value for composites.\n\n${rows.join(
    "\n\n",
  )}`;
}

function providerText(): string {
  return PROVIDER_GROUPS.map(
    (g) =>
      `- **${g.title}** (${g.note}): ${g.names.map((n) => AI_LOGOS[n]?.label ?? n).join(", ")}`,
  ).join("\n");
}

function surfaceText(): string {
  return MACHINE_SURFACES.map((s) => `- [${s.label}](${s.href}): ${s.body}`).join("\n");
}

function cheatSheetText(): string {
  const grammar = GRAMMAR.map((g) => `- \`chart ${g.type}\` — ${g.body} (${g.blurb})`).join("\n");
  const rules = AGENT_RULES.map((r) => `- ${r}`).join("\n");
  const surfaces = MACHINE_SURFACES.map((s) => s.label).join(" · ");
  return `**Agent cheat sheet.** Grammar:\n\n${grammar}\n\nRules:\n\n${rules}\n\nSurfaces: ${surfaces}`;
}

/** Purely-visual components with no textual content worth keeping — removed. */
const VISUAL_ONLY = [
  "StreamDemo",
  "SizeDistribution",
  "ScalingTable",
  "SizeTable",
  "ThroughputSummary",
  "CatalogFacts",
  "FourContexts",
  "PackageTabs",
  "Playground",
  "Instrument",
  "PropTable",
  "Usage",
  "Sizing",
  "ChartChooser",
  "Reveal",
  "Showcase",
];

export function expandComponents(md: string): string {
  let out = md;

  // <Snippet id="x" /> → the real code block
  out = out.replace(/<Snippet\s+id=["']([^"']+)["']\s*\/>/g, (_m, id) => {
    const s = AI_SNIPPETS[id];
    return s ? fence(s.lang, s.code) : "";
  });

  // <GrammarExplorer /> / <ProviderWall /> / <SurfaceCards /> → text equivalents
  out = out.replace(/<GrammarExplorer\s*\/>/g, grammarText());
  out = out.replace(/<ProviderWall\s*\/>/g, providerText());
  out = out.replace(/<SurfaceCards\s*\/>/g, surfaceText());
  out = out.replace(/<AgentCheatSheet\s*\/>/g, cheatSheetText());
  out = out.replace(
    /<CatalogStrip\b[^>]*\/>/g,
    "A representative slice of the catalog spans trends, comparisons, distributions, and status — see every chart type at [/docs/charts](/docs/charts).",
  );

  // <LiveDemo … code={`…`} …>children</LiveDemo> → the code as a tsx block
  out = out.replace(/<LiveDemo\b[^>]*?\bcode=\{`([\s\S]*?)`\}[\s\S]*?<\/LiveDemo>/g, (_m, code) =>
    fence("tsx", unescapeTemplate(code)),
  );
  // self-closing variant
  out = out.replace(/<LiveDemo\b[^>]*?\bcode=\{`([\s\S]*?)`\}[^>]*?\/>/g, (_m, code) =>
    fence("tsx", unescapeTemplate(code)),
  );

  // <DynamicCodeBlock lang="x" code={`…`} /> → a fenced block
  out = out.replace(
    /<DynamicCodeBlock\b[^>]*?\blang=["']([^"']+)["'][^>]*?\bcode=\{`([\s\S]*?)`\}[^>]*?\/>/g,
    (_m, lang, code) => fence(lang, unescapeTemplate(code)),
  );

  // <Callout type="x">…</Callout> → a blockquote
  out = out.replace(/<Callout\b[^>]*>([\s\S]*?)<\/Callout>/g, (_m, inner) => {
    const text = inner.trim().replace(/\n\s*/g, " ");
    return `> ${text}`;
  });

  // <Tab value="X"> → a heading; <Accordion title="X"> → a heading
  out = out.replace(/<Tab\s+value=["']([^"']+)["']\s*>/g, (_m, v) => `\n#### ${v}\n`);
  out = out.replace(/<Accordion\s+title=["']([^"']+)["']\s*>/g, (_m, v) => `\n#### ${v}\n`);

  // Unwrap structural containers (keep their children)
  out = out.replace(/<\/?(?:Tabs|Tab|Steps|Step|Accordions|Accordion|Cards)\b[^>]*>/g, "");

  // <Card title="X" href="Y" description="Z" /> → a link line
  out = out.replace(
    /<Card\b[^>]*?\btitle=["']([^"']+)["'][^>]*?\bhref=["']([^"']+)["'][^>]*?(?:\bdescription=["']([^"']*)["'])?[^>]*?\/>/g,
    (_m, title, href, desc) => `- [${title}](${href})${desc ? `: ${desc}` : ""}`,
  );

  // Drop purely-visual components (self-closing or paired)
  for (const name of VISUAL_ONLY) {
    out = out.replace(new RegExp(`<${name}\\b[^>]*?/>`, "g"), "");
    out = out.replace(new RegExp(`<${name}\\b[^>]*?>[\\s\\S]*?</${name}>`, "g"), "");
  }

  // Tidy: collapse 3+ blank lines to one blank line
  out = out.replace(/\n{3,}/g, "\n\n");
  return out.trim();
}

/** Turn an MDX template-literal body back into literal text. */
function unescapeTemplate(s: string): string {
  return s.replace(/\\`/g, "`").replace(/\\\$/g, "$");
}
