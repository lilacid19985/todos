import TodoForm from "@/components/TodoForm";
import { createTodo } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default function NewTodoPage() {
  return (
    <>
      <div className="head">
        <h1 className="h1">
          New todo
          <small>
            A title on its own is a one-off you check off itself. Add steps and it
            completes once every one of them is checked.
          </small>
        </h1>
      </div>
      <TodoForm action={createTodo} />
    </>
  );
}
