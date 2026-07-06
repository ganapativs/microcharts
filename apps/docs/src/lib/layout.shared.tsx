import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName, gitConfig } from "./shared";
import { Brandmark } from "@/components/brandmark";

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <Brandmark size={22} />
      <span className="font-semibold tracking-[-0.01em]">{appName}</span>
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
