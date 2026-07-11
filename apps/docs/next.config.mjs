import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  // Static export → plain HTML in out/. Deployable to Cloudflare Workers Static
  // Assets, Vercel, Netlify, or any CDN with zero server runtime. Markdown
  // mirrors (`/docs/<slug>.md`) are generated as real static files into
  // `public/docs/` by `scripts/gen-md.mjs` (pre-dev / pre-build), so they work
  // in dev and export alike with no rewrites, middleware, or runtime.
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default withMDX(config);
