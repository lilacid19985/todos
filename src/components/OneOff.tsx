"use client";

import { useState } from "react";
import type { TodoView } from "@/lib/queries";
import Check from "./Check";

/**
 * A todo with no steps, opened up. There's no plan to show — the todo itself
 * is the single line, and checking it here is what finishes it.
 */
export default function OneOff({ todo }: { todo: TodoView }) {
  // Struck through the moment you click, so the tick is never on its own while
  // the page catches up.
  const [ticked, setTicked] = useState(todo.complete);

  return (
    <div className={`one-off${ticked ? " done" : ""}`}>
      <Check id={todo.id} kind="todo" done={todo.complete} small onToggle={setTicked} />
      <span className="step-text">{todo.title}</span>
      <span className="step-who one-off-tag">one-off</span>
    </div>
  );
}
