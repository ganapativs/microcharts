---
"@microcharts/react": patch
---

Fix subpath resolution on StackBlitz and some CDNs. Every export now includes a
`default` condition alongside `import`, so imports like
`@microcharts/react/sparkline/interactive` resolve on loose resolvers that don't
request the `import` condition (they previously failed with "file does not
exist"). Also ship a **minified** dist — smaller install, and correct bytes for
consumers that import the ESM directly (Deno, CDNs). No API changes.
