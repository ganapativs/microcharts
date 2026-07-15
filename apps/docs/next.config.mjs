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
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  // The repo builds on TypeScript 7 (the native `tsc`), whose package exposes no
  // JS compiler API — so Next's build-time type-check can't load it and would try
  // to reinstall TypeScript mid-build. Types are enforced separately by the
  // `typecheck` script (`tsc --noEmit`); skip the redundant in-build pass.
  typescript: { ignoreBuildErrors: true },
};

export default withMDX(config);
