"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Every route change lands at the top of the page — including the redirects
 * back to the board after creating or saving a todo, which would otherwise
 * keep whatever scroll position the form was left at.
 */
export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
