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
import { interactionNote } from "./charts/interaction-note.ts";
import { DOCS_CODE } from "./charts/docs-code.generated.ts";

const fence = (lang: string, code: string) => `\`\`\`${lang}\n${code}\n\`\`\``;

/** Minimal chart shape a `<PropTable>` needs — satisfied by the catalog entry
 *  (`getChart`) in Next and by the raw `entries.generated.json` row in Node. */
type PropLike = {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
  interactive?: boolean;
};
type ChartLike = {
  props: PropLike[];
  interactiveImport?: string;
  animates?: boolean;
  example?: { code: string };
  /** `false` ⇒ no unit picker — see `charts/interaction-note.ts`. */
  picker?: false;
};
export type ResolveChart = (slug: string) => ChartLike | undefined;

const ANIMATE_ROW_NOTE =
  '(interactive) Opt-in entrance motion when the chart mounts client-side — add `import "@microcharts/react/motion"` once. Inert on the server, on hydrated server HTML, and under `prefers-reduced-motion`.';

const SHARED_GRAMMAR_NOTE =
  "Plus the shared grammar — `data`, `domain`, `color`, `title`, `summary`, `format` — and the layout props (`width`, `height`, `className`, `style`) that every chart accepts. Interactive entries also share `animate` and `live`, and — wherever a chart has more than one navigable unit — `onActive`, `onSelect`, `selectedIndex` and `defaultSelectedIndex`; and — wherever the chart shows a hover value — `readout`. See [the shared grammar](/docs/quickstart#the-shared-grammar).";

/** Escape `|` so a type/description never breaks the GFM table row. */
const cell = (s: string) => s.replace(/\|/g, "\\|");

/**
 * Render a chart's props as a GFM table — the textual equivalent of the
 * `<PropTable>` component, from the same registry data, so the `.md` mirror and
 * `/llms-full.txt` carry the real prop reference instead of an empty heading.
 */
function propTableMarkdown(chart: ChartLike): string {
  const rows = chart.props.map((p) => {
    const name = `\`${p.name}\`${p.required ? " (required)" : ""}`;
    const desc = (p.interactive ? "(interactive) " : "") + (p.description ?? "");
    return `| ${name} | \`${cell(p.type)}\` | ${cell(desc)} |`;
  });
  if (chart.interactiveImport && chart.animates !== false) {
    rows.push(`| \`animate\` | \`boolean\` | ${ANIMATE_ROW_NOTE} |`);
  }
  const table = `| Prop | Type | Description |\n| --- | --- | --- |\n${rows.join("\n")}`;
  return `${table}\n\n${SHARED_GRAMMAR_NOTE}`;
}

/** Render a chart's `<Usage>` panel — the canonical import + usage snippet plus
 *  the full-setup door (package + stylesheet) — as text for the mirror. */
function usageMarkdown(chart: ChartLike): string {
  const code = chart.example?.code?.trim();
  if (!code) return "";
  return `${fence("tsx", code)}\n\nSetup (package + stylesheet): [Quickstart](/docs/quickstart#set-up-with-an-ai-agent) or paste [\`/agent-setup.md\`](/agent-setup.md) into your agent.`;
}

const headingLevel = (line: string): number => line.match(/^(#{1,6})\s/)?.[1].length ?? 0;

/**
 * Drop headings left empty once their only child was a stripped visual-only
 * component (e.g. `## Try it` over a `<Playground>`), so the mirror never reads
 * as truncated. A heading is empty only when it has no body *and* no deeper
 * subsection — i.e. the next non-blank line is a heading of the same or higher
 * rank, or end-of-text. A heading followed by a deeper subheading is kept.
 */
function dropEmptyHeadings(md: string): string {
  const lines = md.split("\n");
  const keep: boolean[] = lines.map(() => true);
  for (let i = 0; i < lines.length; i++) {
    const level = headingLevel(lines[i]);
    if (level === 0) continue;
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === "") j++;
    const nextLevel = j < lines.length ? headingLevel(lines[j]) : 1; // EOF acts as top-level
    if (nextLevel > 0 && nextLevel <= level) keep[i] = false;
  }
  return lines.filter((_, i) => keep[i]).join("\n");
}

function grammarText(): string {
  const rows = GRAMMAR.map(
    (g) =>
      `**${g.label}** — ${g.blurb}\n\n\`\`\`microchart ${g.type}\n${g.body}\n\`\`\`\n\nEquivalent React:\n\n${fence("tsx", g.jsx)}`,
  );
  return `The grammar has two forms — a fenced \`microchart\` block for a standalone chart, or an inline \`microchart <type> <data>\` span inside a sentence. Body is whitespace/comma numbers, or key=value for composites.\n\n${rows.join(
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
  const grammar = GRAMMAR.map((g) => `- \`microchart ${g.type}\` — ${g.body} (${g.blurb})`).join(
    "\n",
  );
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
  "PackageTabs",
  "ChartChooser",
];

/**
 * `<Playground>`, `<Sizing>` and `<FourContexts>` are interactive shells, so the
 * mirror can't show what they show — but each is built around real,
 * copy-pasteable JSX, and on a chart page that JSX (the chart at rest, the
 * sizing recipes, the four placements) is the most useful thing an agent can
 * read. The live preview is dropped; the code survives, from the same snapshot
 * the page renders (`charts/docs-code.generated.ts`).
 */
function playgroundMarkdown(slug: string): string {
  const row = DOCS_CODE[slug];
  return row ? fence("tsx", row.playground) : "";
}

function sizingMarkdown(slug: string): string {
  const row = DOCS_CODE[slug];
  if (!row) return "";
  return row.recipes.map((r) => `**${r.label}**\n\n${fence("tsx", r.code)}`).join("\n\n");
}

function fourContextsMarkdown(slug: string): string {
  const row = DOCS_CODE[slug];
  if (!row) return "";
  const blocks = row.contexts.map((c) => `**${c.label}**\n\n${fence("tsx", c.code)}`);
  if (row.contextsNote) blocks.push(row.contextsNote);
  return blocks.join("\n\n");
}

export function expandComponents(md: string, resolveChart?: ResolveChart): string {
  let out = md;

  // <PropTable slug="x" /> → the real prop table (dropped when unresolved, e.g.
  // a caller with no registry access — never leave the tag behind).
  out = out.replace(/<PropTable\s+slug=["']([^"']+)["']\s*\/>/g, (_m, slug) => {
    const chart = resolveChart?.(slug);
    return chart ? propTableMarkdown(chart) : "";
  });

  // <Usage chart="x" /> → the canonical import + usage snippet.
  out = out.replace(/<Usage\s+chart=["']([^"']+)["']\s*\/>/g, (_m, slug) => {
    const chart = resolveChart?.(slug);
    return chart ? usageMarkdown(chart) : "";
  });

  // <InteractionNote slug="x" /> → the shared interaction sentence for that
  // chart (nothing for static-only charts and the two contract exceptions).
  out = out.replace(/<InteractionNote\s+slug=["']([^"']+)["']\s*\/>/g, (_m, slug) => {
    const chart = resolveChart?.(slug);
    return chart ? (interactionNote({ ...chart, slug }) ?? "") : "";
  });

  // <Playground chart="x" /> / <Sizing chart="x" /> / <FourContexts slug="x" />
  // → their JSX as fenced blocks (see the note above these builders).
  out = out.replace(/<Playground\s+chart=["']([^"']+)["']\s*\/>/g, (_m, slug) =>
    playgroundMarkdown(slug),
  );
  out = out.replace(/<Sizing\s+chart=["']([^"']+)["']\s*\/>/g, (_m, slug) => sizingMarkdown(slug));
  out = out.replace(/<FourContexts\s+slug=["']([^"']+)["']\s*\/>/g, (_m, slug) =>
    fourContextsMarkdown(slug),
  );

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
  // no-code variant (e.g. the per-chart hero) — the JSX children *are* the demo.
  out = out.replace(/<LiveDemo\b[^>]*>([\s\S]*?)<\/LiveDemo>/g, (_m, inner) => {
    const jsx = dedent(inner);
    return jsx ? fence("tsx", jsx) : "";
  });

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

  // Drop purely-visual components (self-closing or paired). The three projected
  // shells ride along so an unexpected authoring form (extra prop, different
  // attribute order) is still dropped rather than left as a literal tag.
  for (const name of [...VISUAL_ONLY, "Playground", "Sizing", "FourContexts"]) {
    out = out.replace(new RegExp(`<${name}\\b[^>]*?/>`, "g"), "");
    out = out.replace(new RegExp(`<${name}\\b[^>]*?>[\\s\\S]*?</${name}>`, "g"), "");
  }

  // Tidy: collapse 3+ blank lines to one blank line
  out = out.replace(/\n{3,}/g, "\n\n");
  // Remove headings whose section was emptied by a stripped visual component.
  out = dropEmptyHeadings(out);
  return out.trim();
}

/** Turn an MDX template-literal body back into literal text. */
function unescapeTemplate(s: string): string {
  return s.replace(/\\`/g, "`").replace(/\\\$/g, "$");
}

/** Trim blank edge lines and strip the common leading indentation from a block. */
function dedent(s: string): string {
  const lines = s.replace(/^\n+|\s+$/g, "").split("\n");
  const indent = Math.min(
    ...lines.filter((l) => l.trim() !== "").map((l) => l.match(/^ */)?.[0].length ?? 0),
  );
  return lines.map((l) => l.slice(indent)).join("\n");
}
