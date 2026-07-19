// Side-effect CSS imports are erased by the bundler and carry no type surface.
// Declared here only so `import "../../styles.css"` typechecks in the browser
// test project, which must load the real stylesheet to observe the real cascade.
declare module "*.css";
