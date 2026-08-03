import Link from "next/link";
import TodoItem from "@/components/TodoItem";
import { getBoard } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AllTodosPage() {
  const board = await getBoard();
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
          {board.todos.length > 0 && (
            <div className="list">
              {board.todos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))}
            </div>
          )}

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
