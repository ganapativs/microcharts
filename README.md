# microcharts

**Word-sized charts for React.** Zero dependencies, ~1–2 kB gzip per chart,
accessible by default, handcrafted-feeling — built for hundreds of instances per
page.

> **Status: pre-release scaffold.** The API is being built against a complete,
> researched plan in [`plan/`](./plan) (start at [`plan/README.md`](./plan/README.md)).
> `@microcharts/react@0.0.1` on npm is a placeholder. Not usable yet.

## Why

The category leader (`react-sparklines`) has been unmaintained since 2017 and
nothing modern replaces it. microcharts is a fresh take:

- **Zero runtime dependencies** — React is the only peer. CI-enforced.
- **RSC-native static charts** — default components are pure SVG, no client JS.
  Interactivity is a separate opt-in entry.
- **Accessible by default** — every chart ships an auto-generated natural-language
  summary as its accessible name.
- **Tiny + honest** — per-chart size budgets are CI gates; every chart has one
  documented, honest encoding channel.

## Install (not yet functional)

```bash
pnpm add @microcharts/react
```

```tsx
// Phase 2 — shape of the intended API
import { Sparkline } from "@microcharts/react/sparkline";
import "@microcharts/react/styles.css";

<Sparkline data={[3, 5, 4, 8, 6, 9, 7]} />;
```

## Development

```bash
pnpm install
pnpm check     # typecheck + lint + format + test + knip
pnpm build
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) and the [plan](./plan/README.md).

## License

[MIT](./LICENSE) © Ganapati V S
