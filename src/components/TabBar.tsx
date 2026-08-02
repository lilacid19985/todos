"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The mobile navigation: the sidebar is hidden below the breakpoint and this
 * takes its place, fixed to the bottom with New in the middle.
 */
export default function TabBar() {
  const pathname = usePathname();
  const on = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="tabbar">
      <Link href="/" className={`tab${on("/") ? " on" : ""}`}>
        <span className="ico" aria-hidden="true">
          ◆
        </span>
        <span>Next up</span>
      </Link>

      <Link href="/new" className="tab new" aria-label="New todo">
        <span className="ico" aria-hidden="true">
          +
        </span>
      </Link>

      <Link href="/all" className={`tab${on("/all") ? " on" : ""}`}>
        <span className="ico" aria-hidden="true">
          ≡
        </span>
        <span>All todos</span>
      </Link>
    </nav>
  );
}
