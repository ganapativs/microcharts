import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export → deployable to Cloudflare Pages as pure static assets.
  // Server Components still render at build time, so the charts are baked into
  // the HTML as pure SVG (the RSC/static-first story) with zero server runtime.
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // Monorepo has a parent pnpm-lock; pin the tracing root so Next doesn't treat
  // the package repo as the app and 404 every route in `next dev`.
  outputFileTracingRoot: root,
};
export default nextConfig;
