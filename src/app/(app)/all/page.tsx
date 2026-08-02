import Link from "next/link";
import SortBar from "@/components/SortBar";
import TodoItem from "@/components/TodoItem";
import { getBoard, parseSort } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AllTodosPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const sort = parseSort((await searchParams).sort);
  const board = await getBoard(sort);
  const nothingAtAll = board.activeCount === 0 && board.completed.length === 0;

  return (
    <>
      <div className="head">
        <h1 className="h1">
          All todos
          <small>
            {board.activeCount} open · {board.completed.length} completed. Click any
            row for its steps.
          </small>
        </h1>
        {!nothingAtAll && <SortBar current={sort} basePath="/all" />}
      </div>

      {nothingAtAll ? (
        <div className="empty">
          Nothing here yet.{" "}
          <Link className="link" href="/new">
            Create your first todo
          </Link>
        </div>
      ) : (
        <>
          {board.groups.map((group) => (
            <div key={group.key}>
              {group.label && <div className="group-label">{group.label}</div>}
              <div className="list">
                {group.todos.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </div>
            </div>
          ))}

          {board.completed.length > 0 && (
            <>
              <div className="group-label">Completed · {board.completed.length}</div>
              <div className="list">
                {board.completed.map((todo) => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
