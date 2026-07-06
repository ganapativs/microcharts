/** @type {import('next').NextConfig} */
export default {
  // Static export → plain HTML in out/. Proves the page (and its charts) need
  // no server at runtime and ship as prerendered markup.
  output: "export",
};
