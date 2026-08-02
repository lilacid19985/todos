import Link from "next/link";
import { notFound } from "next/navigation";
import TodoForm from "@/components/TodoForm";
import { deleteTodo, updateTodo } from "@/lib/actions";
import { getTodo } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditTodoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const todo = await getTodo(id);
  if (!todo) notFound();

  return (
    <>
      <Link href="/" className="back">
        <span className="ico" aria-hidden="true">
          ←
        </span>
        Back
      </Link>

      <div className="head">
        <h1 className="h1">Edit todo</h1>
      </div>
      <TodoForm todo={todo} action={updateTodo} deleteAction={deleteTodo} />
    </>
  );
}
