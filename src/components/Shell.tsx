"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import TabBar from "./TabBar";

/**
 * Owns the sidebar collapse state. The initial value comes from a cookie the
 * server already read, so the rail never flashes open on load.
 */
export default function Shell({
  collapsed: initial,
  sidebar,
  children,
}: {
  collapsed: boolean;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(initial);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `sidebar=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  };

  return (
    <div className={`shell${collapsed ? " collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="side-top">
          <Link href="/" className="wordmark">
            todos<i>.</i>
          </Link>
          <button
            type="button"
            className="collapse"
            onClick={toggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>
        {sidebar}
      </aside>
      <div className="main">{children}</div>
      <TabBar />
    </div>
  );
}
