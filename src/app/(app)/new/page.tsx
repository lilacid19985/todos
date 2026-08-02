import TodoForm from "@/components/TodoForm";
import { createTodo } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function NewTodoPage() {
  return (
    <>
      <div className="head">
        <h1 className="h1">
          New todo
          <small>A todo completes itself once every step under it is checked off.</small>
        </h1>
      </div>
      <TodoForm action={createTodo} />
    </>
  );
}
