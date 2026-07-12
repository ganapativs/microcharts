/** Provider groups + machine-surface metadata (shared by React + md-transform). */
export interface ProviderGroup {
  title: string;
  note: string;
  names: string[];
}

export const PROVIDER_GROUPS: ProviderGroup[] = [
  {
    title: "Chat assistants",
    note: "emit a chart block mid-reply",
    names: ["claude", "openai", "gemini", "perplexity", "mistral"],
  },
  {
    title: "Coding agents & harnesses",
    note: "scaffold components from the API",
    names: [
      "cursor",
      "claude-code",
      "codex",
      "opencode",
      "cline",
      "amp",
      "zed",
      "continue",
      "roocode",
      "warp",
      "copilot",
      "windsurf",
      "antigravity",
    ],
  },
  {
    title: "Frameworks & SDKs",
    note: "render tool output to charts",
    names: ["vercel", "langchain"],
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
    body: "Machine catalog: each chart’s name, import paths, data shape, and props — generated from the same registry that builds this site.",
  },
  {
    href: "/docs/ai.md",
    label: "*.md mirrors",
    note: "clean Markdown",
    body: "Append .md to any docs page for a Markdown copy an agent reads without parsing HTML — every component expanded to text and code.",
  },
];
