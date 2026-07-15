import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { DocsSidebarChrome } from "@/components/docs-sidebar-chrome";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      // prefetch=false: with 100+ sidebar links, Link prefetch floods first load
      // with every route's flight payload + chunk graph (~1 MB before idle).
      sidebar={{ tabs: false, prefetch: false, footer: <DocsSidebarChrome /> }}
      themeSwitch={{ enabled: false }}
    >
      {/* Landmark + skip-link target; `contents` keeps Fumadocs' layout intact. */}
      <main id="main-content" className="contents">
        {children}
      </main>
    </DocsLayout>
  );
}
