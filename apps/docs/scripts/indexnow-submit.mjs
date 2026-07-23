#!/usr/bin/env node
/**
 * Submit the sitemap's URLs to IndexNow (Bing, Yandex, Naver, Seznam, Yep).
 * Google does not consume IndexNow — use Search Console for Google.
 *
 * The key file (public/<key>.txt) must already be deployed and publicly
 * reachable, so run this AFTER `wrangler deploy` (wired into cf:deploy).
 * One POST to api.indexnow.org fans out to every participating engine.
 *
 * Usage: node scripts/indexnow-submit.mjs [--dry-run]
 */

import { readFileSync } from "node:fs";

const KEY = "6365d7c06ab04c6a854a8eb7b3d6f785";
const HOST = "microcharts.dev";
const SITEMAP = new URL("../out/sitemap.xml", import.meta.url);
const dryRun = process.argv.includes("--dry-run");

const xml = readFileSync(SITEMAP, "utf8");
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (urls.length === 0) throw new Error("no <loc> entries found in out/sitemap.xml — build first");
if (urls.length > 10000) throw new Error("IndexNow caps a submission at 10,000 URLs");

const keyUrl = `https://${HOST}/${KEY}.txt`;
console.log(`submitting ${urls.length} URLs for ${HOST} to api.indexnow.org`);
if (dryRun) {
  console.log(urls.slice(0, 5).join("\n"), "\n… (dry run, nothing sent)");
  process.exit(0);
}

const live = await fetch(keyUrl);
const body = (await live.text()).trim();
if (!live.ok || body !== KEY) {
  throw new Error(
    `key file not live at ${keyUrl} (status ${live.status}) — deploy before submitting`,
  );
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: keyUrl, urlList: urls }),
});

// 200 = OK, 202 = accepted (key validation pending). Anything else is a bug.
console.log(`IndexNow response: ${res.status} ${res.statusText}`);
if (res.status !== 200 && res.status !== 202) {
  console.error(await res.text());
  process.exit(1);
}
