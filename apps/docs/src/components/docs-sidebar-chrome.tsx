import { SITE } from "@/lib/site";
import { AppearanceMenu } from "@/components/appearance-menu";

function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

/**
 * Docs sidebar footer — GitHub + the appearance/accent control, bottom-right,
 * out of the reading column. Replaces the orphaned in-tree picker link.
 */
export function DocsSidebarChrome() {
  return (
    <div className="flex items-center justify-between gap-1 pt-1">
      <div className="flex items-center gap-2">
        <a
          href={SITE.repo}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="GitHub repository"
          className="ghost-ctrl size-8"
        >
          <GithubMark />
        </a>
        <a
          href={`${SITE.repo}/releases`}
          target="_blank"
          rel="noreferrer noopener"
          className="mono-label link-underline"
        >
          Releases
        </a>
      </div>
      <AppearanceMenu />
    </div>
  );
}
