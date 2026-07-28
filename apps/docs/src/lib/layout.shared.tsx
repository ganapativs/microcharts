import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName } from "./shared";
import { Brandmark } from "@/components/brandmark";

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <Brandmark size={22} />
      <span className="font-display font-semibold tracking-[-0.016em]">{appName}</span>
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
    // No standalone links: the wordmark is the way back home, and the sidebar
    // tree already owns a "Charts" section — anything else here just
    // duplicates an existing door.
    links: [],
  };
}
