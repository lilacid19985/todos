import Link from "next/link";
import NextUpBoard from "@/components/NextUpBoard";
import { getBoard } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NextUpPage() {
  const board = await getBoard();

  return (
    <>
      <div className="head">
        <h1 className="h1">Next up</h1>
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
        <NextUpBoard cards={board.cards} completed={board.completed} />
      )}
    </>
  );
}
