"use client";

// Sidebar nav is a small client island purely for active-route highlighting.
// The pages themselves stay Server Components.
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Overview", index: "01" },
  { href: "/revenue", label: "Revenue", index: "02" },
  { href: "/engagement", label: "Engagement", index: "03" },
  { href: "/experiments", label: "Experiments", index: "04" },
  { href: "/accounts", label: "Accounts", index: "05" },
  { href: "/live", label: "Live", index: "06" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav" aria-label="Primary">
      <span className="nav-label">Contents</span>
      {items.map((it) => {
        const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined}>
            <span className="nav-index" aria-hidden>
              {it.index}
            </span>
            {it.label}
            <span className="nav-tick" aria-hidden />
          </Link>
        );
      })}
    </nav>
  );
}
