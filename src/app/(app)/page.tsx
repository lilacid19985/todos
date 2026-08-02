import Link from "next/link";
import NextUpBoard from "@/components/NextUpBoard";
import SortBar from "@/components/SortBar";
import { getBoard, parseSort } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NextUpPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const sort = parseSort((await searchParams).sort);
  const board = await getBoard(sort);

  return (
    <>
      <div className="head">
        <h1 className="h1">Next up</h1>
        {board.activeCount > 0 && <SortBar current={sort} basePath="/" />}
      </div>

      {board.activeCount === 0 ? (
        <div className="empty">
          {board.completed.length > 0 ? (
            <>
              All clear — nothing open.{" "}
              <Link className="link" href="/new">
                Start something new
              </Link>
            </>
          ) : (
            <>
              Nothing here yet.{" "}
              <Link className="link" href="/new">
                Create your first todo
              </Link>
            </>
          )}
        </div>
      ) : (
        <NextUpBoard
          groups={board.cardGroups}
          completed={board.completed}
          heroId={board.heroId}
        />
      )}
    </>
  );
}
