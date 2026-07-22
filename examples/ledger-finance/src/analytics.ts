// Cloudflare Web Analytics — privacy-first, cookieless page-view/visit beacon.
// Injected only when VITE_CF_BEACON_TOKEN is set at build time; otherwise a no-op.
// Get a token: Cloudflare dashboard → Web Analytics → Add a site → copy the token
// (or just enable Web Analytics on the Pages project, which auto-injects instead). See DEPLOY.md.
const token = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
  ?.VITE_CF_BEACON_TOKEN;
if (token) {
  const s = document.createElement("script");
  s.defer = true;
  s.src = "https://static.cloudflareinsights.com/beacon.min.js";
  s.setAttribute("data-cf-beacon", JSON.stringify({ token }));
  document.head.appendChild(s);
}
export {};
