"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link href={href} className={`side-link${active ? " on" : ""}`} title={label}>
      <span className="ico" aria-hidden="true">
        {icon}
      </span>
      <span className="side-label">{label}</span>
    </Link>
  );
}
