import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  // Static export → plain HTML in out/. Deployable to Cloudflare Workers Static
  // Assets, Vercel, Netlify, or any CDN with zero server runtime.
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default withMDX(config);
