"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CondoOperationalModule } from "../../lib/operations/modules";

type DashboardNavProps = {
  modules: CondoOperationalModule[];
};

function moduleInitials(title: string) {
  return title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav({ modules }: DashboardNavProps) {
  const pathname = usePathname();
  const items = [{ href: "/dashboard", key: "dashboard", title: "Dashboard" }, ...modules];

  return (
    <nav className="condo-nav" aria-label="Navegacao operacional">
      {items.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`condo-nav-link${active ? " active" : ""}`}
            href={item.href}
            key={item.key}
          >
            <span className="condo-nav-icon" aria-hidden="true">
              {moduleInitials(item.title)}
            </span>
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
