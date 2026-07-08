import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName } from "./shared";
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
    // GitHub + the accent/appearance control live in the sidebar footer
    // (see DocsSidebarChrome), not as nav links — so they sit bottom-right,
    // out of the reading column.
    links: [
      { text: "Home", url: "/" },
      { text: "Gallery", url: "/gallery" },
    ],
  };
}
