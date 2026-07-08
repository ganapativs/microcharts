import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { baseOptions } from "@/lib/layout.shared";
import { DocsSidebarChrome } from "@/components/docs-sidebar-chrome";

export default function Layout({ children }: LayoutProps<"/docs">) {
  return (
    <DocsLayout
      tree={source.getPageTree()}
      {...baseOptions()}
      sidebar={{ tabs: false, footer: <DocsSidebarChrome /> }}
      themeSwitch={{ enabled: false }}
    >
      {children}
    </DocsLayout>
  );
}
