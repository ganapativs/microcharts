# 14 — AI-Native Integration

> Status: draft v1 · Added 2026-07-06. Goal: LLMs generate, stream, and reason about microcharts first-try. Prior art: Mermaid fenced blocks (the most successful LLM-renderable format ever shipped), Vega-Lite JSON specs.

## 1. The chart spec — one JSON dialect, three consumers

A compact, prop-mirroring JSON format. Not a new grammar — a serialization of the existing prop grammar (`04-api-design.md`), so humans, LLMs, URLs, and React stay in sync by construction.

```json
{
  "type": "sparkline",
  "data": [3, 5, 4, 8, 6, 9],
  "curve": "smooth",
  "title": "Weekly revenue",
  "theme": "newspaper",
  "width": 120, "height": 24
}
```

Consumers:
1. **React**: `<MicroChart spec={obj} />` (validates + dispatches to the right component).
2. **Markdown/streaming**: fenced block ` ```microchart ` (below).
3. **URL/server**: query-param / POST-body form of the same spec (`13-universal-rendering.md` §2.3).

Design rules:
- Every field = a documented prop; same names, same defaults, same enums. Zero translation layer to hallucinate around.
- **Published JSON Schema** (`microcharts/spec.schema.json`) — powers validation, editor autocomplete, LLM constrained decoding/tool-use, and the docs' spec reference. Versioned with the library.
- Forgiving parser: unknown fields ignored with dev-warning; `data` alone renders something beautiful (the "80% case" rule holds for machines too).

## 2. Streaming-native rendering (the delight feature)

LLMs stream. The renderer tolerates **partial spec JSON** and renders progressively:

- Incremental parser accepts truncated JSON (unclosed arrays/strings — same trick streamdown/AI SDK use for markdown). Once `"type"` + first data points arrive → chart appears and **grows point-by-point as tokens stream in**. The draw-in animation *is* the streaming state — delight and function converge.
- Ships as `microcharts/stream`: `parsePartialSpec(text) → {spec, complete}` (pure, zero-dep) + `<StreamingMicroChart text={buffer}>`.
- Reduced-motion: progressive growth still occurs (it's content, not decoration) but without tweening.

## 3. Markdown ecosystem integration (recipes + tiny adapters)

| Target | Mechanism |
|---|---|
| **streamdown** (Vercel AI SDK ecosystem; verified active 2026-03) | code-block renderer override for `microchart` lang → `<StreamingMicroChart>` — first-class recipe, the AI-chat use case |
| react-markdown / MDX | `code` component override recipe |
| rehype plugin | `rehype-microcharts` (v1.x, zero-dep) transforms fenced blocks at build time into **static SVG strings** — works in any SSG, no client JS |
| GitHub READMEs | can't run plugins → chart-as-URL badge endpoint (`13` §2.3) covers it |

Convention: ` ```microchart ` fenced block, JSON body. Also accept ` ```microchart:sparkline ` shorthand (type in info string, body = data/options only) for token economy.

## 4. LLM legibility stack

- **llms.txt + markdown docs mirror** (already planned) now includes the spec schema + 20 canonical spec examples (one per chart, one per theme).
- **System-prompt snippet** published in docs: ~15 lines teaching an assistant the fenced-block format — copy-paste into any chatbot. (The Mermaid lesson: LLMs learned it because examples saturated docs everywhere; we seed deliberately.)
- Component APIs stay guessable: an LLM that guesses props from the chart name should usually be right (enforced informally in API review — "would GPT/Claude guess this?").
- **MCP stance updated**: earlier research said skip; the spec changes the math — an MCP server is now ~50 lines (validate spec → return SVG string/data-URI). Ship as `examples/mcp-server` (not a published product) in v1.x; promote only if usage appears.

## 5. Agent-friendly repo (existing plan, restated as one surface)

llms.txt · JSON Schema · plain-markdown docs mirror · copy-paste CLI (`npx microcharts add sparkline`) · self-describing single-file components. Everything an agent touches is plain text with one canonical vocabulary — the spec.

## 6. Verification notes

- streamdown active (registry: 2.5.0, 2026-03-17). react-markdown mature (10.1.0, 2025-03). Partial-JSON streaming parse = in-house pure function, no dep.
- Mermaid-in-fenced-blocks as LLM-format precedent: common knowledge, uncontroversial. Vega-Lite JSON-spec precedent: established.
- Added to audit doc.
