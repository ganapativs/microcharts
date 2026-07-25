# @microcharts/mcp

An MCP server and Vercel AI-SDK toolset for [microcharts](https://microcharts.dev) — let a model **find** the right
word-sized chart, **get** exactly how to wire it, and **render** it to a finished SVG with real alt text.

microcharts is built so a model can _write_ charts. This is how a model _calls_ them: not "emit some grammar and hope
the client renders it," but a tool call that returns the real library's static SVG, honest by construction, with the
generated `describeSeries` accessible name attached.

- **Runs on your machine.** stdio server, distributed on npm. Nothing is hosted; no account, no key, no data leaves.
- **Works anywhere.** The render tool returns self-contained SVG, so a chat surface that can't run React can still show
  a real chart.
- **Zero setup.** `npx @microcharts/mcp` — the package brings its own copy of `@microcharts/react`.

## Install

Add it to any MCP client. For **Claude Desktop** (`claude_desktop_config.json`) or **Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "microcharts": {
      "command": "npx",
      "args": ["-y", "@microcharts/mcp"]
    }
  }
}
```

That's it — the client spawns the server over stdio on demand.

## Tools

### `find_microchart(question, dataShape?)`

Rank the catalog against a plain-language question. Start here when you know the question, not the chart.

```
find_microchart({ question: "is it trending?" })
→ [{ slug: "sparkline", name: "Sparkline", why: "inline trend", dataShape: "number[]" }, …]
```

### `get_microchart(slug)`

Everything needed to wire one chart: import paths, its props plus the shared props, data shape, best/avoid guidance, a
copy-runnable example, and `sample` — that same example as JSON props, ready to pass straight to `render_microchart`.

```
get_microchart({ slug: "bullet" })
→ {
    staticImport: "@microcharts/react/bullet",
    props: [...],
    example: { code: "<Bullet value={72} target={80} bands={[50, 90]} title=\"Quota\" />" },
    sample: { value: 72, target: 80, bands: [50, 90], title: "Quota" },
    …
  }
```

Every chart takes its own data shape — `number[]` for a sparkline, `{ label, value }[]` for a dot plot,
`{ open, high, low, close }[]` for OHLC — so `sample` is the shortest path from "which chart" to "a render that works".

### `render_microchart(type, data?, props?, format?)`

Render to a finished, self-contained SVG plus its generated alt text. Pass the series as `data`; put other props
(`value`, `target`, `curve`, `color`, `width`) in `props`.

```
render_microchart({ type: "sparkline", data: [132, 148, 141, 165, 159, 182] })
→ {
    svg: "<svg …><style>…</style>…</svg>",
    summary: "Trending up 38%. Range 132 to 182. Last value 182.",
    mimeType: "image/svg+xml", width: 80, height: 20
  }
```

`format` is `"svg"` (default, styles embedded — drops into any surface) or `"bare"` (no CSS, for pages that already load
`@microcharts/react/styles.css`).

Missing or wrong-shaped data is rejected by name rather than passed through to React, so a caller gets
`"dot-plot" needs \`data\`. Data shape: { label, value }[]. Call get_microchart("dot-plot") for a ready-to-render
sample.` instead of a stack trace. Oversized payloads are refused too — a microchart is a word-sized mark.

It also exposes two resources: `microcharts://catalog` (every chart + metadata) and `microcharts://agent-setup` (the
prompt for wiring microcharts into a codebase).

## Use it from the Vercel AI SDK

The same three capabilities ship as AI-SDK tools (on the `/ai-sdk` subpath, so the core never pulls in `ai`):

```ts
import { microchartsTools } from "@microcharts/mcp/ai-sdk";
import { streamText } from "ai";

const result = streamText({
  model,
  tools: microchartsTools,
  prompt: "Summarise this quarter and show the revenue trend as a chart.",
});
```

The functions are exported directly too — `findChart`, `getChart`, `renderChart` — if you want them without the tool
wrapper.

## Versioning

This server bundles the chart catalog and renders with `@microcharts/react` (installed as a normal dependency). Its
version tracks its own changes; a compatible library is pulled in automatically. The library version a given snapshot
was cut from is on the `microcharts://catalog` resource.

## Links

- Docs: <https://microcharts.dev/docs/mcp>
- Library: [`@microcharts/react`](https://www.npmjs.com/package/@microcharts/react)
- Source: <https://github.com/ganapativs/microcharts/tree/main/packages/mcp>

MIT
