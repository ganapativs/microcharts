// Side-effect CSS imports are erased by the bundler and carry no type surface.
// Declared here only so `import "../../styles.css"` typechecks in the browser
// test project, which must load the real stylesheet to observe the real cascade.
declare module "*.css";

// `import.meta.glob` is Vite's, not the runtime's. The source-level guards
// elsewhere read the catalog with `node:fs`, which a BROWSER test cannot do —
// so the one that has to scan sources from inside the browser globs them
// instead, and this is the narrow type for it. Not `vite/client`: pulling that
// in would add every Vite ambient (asset modules, `import.meta.env`, hot) to a
// package whose own build is tsdown.
interface ImportMeta {
  glob: (
    pattern: string,
    options: { query: string; import: string; eager: true },
  ) => Record<string, string>;
}
