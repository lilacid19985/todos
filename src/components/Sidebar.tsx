import Link from "next/link";
import NavLink from "./NavLink";

export default function Sidebar() {
  return (
    <>
      <nav className="side-nav">
        <NavLink href="/" icon="◆" label="Next up" />
        <NavLink href="/all" icon="≡" label="All todos" />
      </nav>

      <Link href="/new" className="side-new" title="New todo">
        <span className="ico" aria-hidden="true">
          +
        </span>
        <span className="side-label">New todo</span>
      </Link>
    </>
  );
}
