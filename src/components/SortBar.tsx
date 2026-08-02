import Link from "next/link";
import { SORTS, type SortKey } from "@/lib/queries";

export default function SortBar({
  current,
  basePath = "/",
}: {
  current: SortKey;
  basePath?: string;
}) {
  return (
    <div className="sortbar">
      {SORTS.map((sort) => (
        <Link
          key={sort.key}
          href={sort.key === "priority" ? basePath : `${basePath}?sort=${sort.key}`}
          aria-current={sort.key === current ? "true" : undefined}
        >
          {sort.label}
        </Link>
      ))}
    </div>
  );
}
