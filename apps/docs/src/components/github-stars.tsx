"use client";

import { useEffect, useState } from "react";
import { SITE } from "@/lib/site";

/**
 * Live star count for the nav's GitHub control. Fail-open by design: the
 * anchor is always the plain icon, and the count is a progressive garnish —
 * no fetch, a failed fetch, or a small count all render exactly what the nav
 * rendered before this component existed. Nothing here is load-bearing.
 *
 * - One unauthenticated GitHub API call, cached in localStorage for 6 h, so a
 *   browsing session costs a single request (the 60/h anon limit is plenty).
 * - Below MIN_STARS the count stays hidden: an icon with no number reads as
 *   "a repository", while a tiny number would read as "an empty room". The
 *   moment the number is worth showing, it shows — honest, just not eager.
 * - The label fades in on a fixed-width-free pill; the nav flexes once per
 *   6 h at most, and never on cached loads.
 */
const CACHE_KEY = "mc-gh-stars";
const TTL_MS = 6 * 60 * 60 * 1000;
const MIN_STARS = 100;

function formatStars(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  return `${k >= 10 ? Math.round(k) : Math.round(k * 10) / 10}k`;
}

function useGithubStars(repo: string): number | null {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as { n: number; t: number };
        if (Date.now() - cached.t < TTL_MS) {
          // localStorage is an external system and is not readable during SSR, so
          // this cannot move into a lazy initializer without a hydration mismatch.
          // oxlint-disable-next-line react/set-state-in-effect
          setStars(cached.n);
          return;
        }
      }
    } catch {
      /* storage unavailable — fall through to fetch */
    }
    void fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { stargazers_count?: number } | null) => {
        const n = json?.stargazers_count;
        if (cancelled || typeof n !== "number") return;
        setStars(n);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ n, t: Date.now() }));
        } catch {
          /* fine uncached */
        }
      })
      .catch(() => {
        /* offline / rate-limited — the icon alone is the design */
      });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  return stars !== null && stars >= MIN_STARS ? stars : null;
}

/** `owner/name` derived from the one canonical repo URL in SITE. */
const REPO = new URL(SITE.repo).pathname.slice(1);

/** The count label itself — rendered inside the nav's GitHub anchor. */
export function GithubStarCount({ repo = REPO }: { repo?: string }) {
  const stars = useGithubStars(repo);
  if (stars === null) return null;
  return (
    <span className="pop-in pr-0.5 font-mono text-[0.7rem] font-medium tabular-nums leading-none">
      {formatStars(stars)}
    </span>
  );
}
