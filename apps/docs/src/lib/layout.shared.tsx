import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName, gitConfig } from "./shared";

function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect width="32" height="32" rx="7" className="fill-fd-primary" />
        <path
          d="M6 21L11 16L15 18L20 10.5L25.5 6.5"
          className="stroke-fd-primary-foreground"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="25.5" cy="6.5" r="2.6" className="fill-fd-primary-foreground" />
      </svg>
      <span className="font-semibold tracking-tight">{appName}</span>
    </span>
  );
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Wordmark />,
      transparentMode: "top",
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      { text: "Gallery", url: "/gallery" },
      { text: "Home", url: "/" },
    ],
  };
}
