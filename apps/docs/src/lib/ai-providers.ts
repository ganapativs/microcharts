/** Provider groups + machine-surface metadata (shared by React + md-transform). */
export interface ProviderGroup {
  title: string;
  note: string;
  /** Most-recognizable first — the compact home wall shows `lead` with logos,
   *  the rest as a light text tail; the full docs wall shows them all. */
  names: string[];
  /** How many of `names` lead with a logo in the compact variant. */
  lead: number;
}

export const PROVIDER_GROUPS: ProviderGroup[] = [
  {
    title: "Chat assistants & models",
    note: "emit a chart block mid-reply",
    lead: 4,
    names: [
      "claude",
      "openai",
      "gemini",
      "grok",
      "deepseek",
      "kimi",
      "meta",
      "mistral",
      "perplexity",
      "qwen",
      "poe",
    ],
  },
  {
    title: "Coding agents & IDEs",
    note: "scaffold components from the typed catalog",
    lead: 6,
    names: [
      "cursor",
      "claude-code",
      "codex",
      "v0",
      "opencode",
      "antigravity",
      "windsurf",
      "zed",
      "cline",
      "replit",
      "continue",
      "warp",
      "amp",
      "roocode",
      "stackblitz",
      "jetbrains",
      "pi",
      "copilot",
    ],
  },
  {
    title: "Frameworks & SDKs",
    note: "map tool-call output to charts",
    lead: 4,
    names: [
      "vercel",
      "openai-agents",
      "langchain",
      "anthropic",
      "huggingface",
      "ollama",
      "pydantic",
      "crewai",
    ],
  },
];

/** The golden rules an agent needs — the whole API contract in five lines. */
export const AGENT_RULES: string[] = [
  "Import each chart from its own subpath — `@microcharts/react/<name>`; add `/interactive` only for hover and keyboard.",
  "Static charts are hook-free — valid inside a React Server Component, zero client JavaScript.",
  "Pass `data` and a `title`; the generated summary handles accessibility. Use `summary={false}` only when a chart is decorative inside describing text.",
  "Never add a runtime dependency, and never reach for a pie or gauge — they aren't shipped.",
];

export interface MachineSurface {
  href: string;
  label: string;
  note: string;
  body: string;
  /** Optional subordinate link (e.g. the JSON Schema that describes this surface). */
  aux?: { href: string; label: string };
}

export const MACHINE_SURFACES: MachineSurface[] = [
  {
    href: "/llms.txt",
    label: "/llms.txt",
    note: "curated docs map",
    body: "A hand-curated index of the docs for LLM tools, with explicit “does not support” notes to head off hallucinations.",
  },
  {
    href: "/llms-full.txt",
    label: "/llms-full.txt",
    note: "the full corpus",
    body: "Every doc page concatenated into one text file — drop the whole API into a context window at once.",
  },
  {
    href: "/catalog.json",
    label: "/catalog.json",
    note: "every chart, typed",
    body: "Machine catalog: each chart’s name, import paths, data shape, and props (plus a shared-grammar block) — generated from the same registry that builds this site, and validated in CI against its JSON Schema.",
    aux: { href: "/catalog.schema.json", label: "JSON Schema" },
  },
  {
    href: "/docs/ai.md",
    label: "*.md mirrors",
    note: "clean Markdown",
    body: "Append .md to any page for a Markdown copy an agent reads without parsing HTML — every component expanded to text and code. Sending Accept: text/markdown to the page URL returns the same bytes.",
  },
  {
    href: "/openapi.json",
    label: "/openapi.json",
    note: "the endpoints, typed",
    body: "OpenAPI 3.1 description of every machine-readable route here, with an operation id, typed parameters and a response schema on each one. Point a function-calling agent at it and the surface loads itself.",
  },
  {
    href: "/api/charts.json",
    label: "/api/charts.json",
    note: "one chart per fetch",
    body: "An index of every chart type, each linking to /api/charts/<slug>.json — that chart’s props, imports and caveats in about 8 kB instead of the full catalog’s 290 kB.",
  },
];
