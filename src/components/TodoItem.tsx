"use client";

import Link from "next/link";
import { useState } from "react";
import type { TodoView } from "@/lib/queries";
import { priorityLabel, priorityStyle } from "@/lib/priority";
import StepList from "./StepList";

export default function TodoItem({ todo }: { todo: TodoView }) {
  const [open, setOpen] = useState(false);

  let subline: string;
  if (todo.complete) subline = "Complete";
  else if (todo.nextSteps.length > 1) {
    const titles = todo.nextSteps.map((step) => step.title).join(" · ");
    subline = `Next (${todo.nextSteps.length} at once): ${titles}`;
  } else if (todo.nextSteps.length === 1) {
    const [step] = todo.nextSteps;
    subline = `Next: ${step.title}${step.mine ? "" : " · someone else"}`;
  } else subline = "No steps yet";

  return (
    <div className="row" style={priorityStyle(todo.priority)}>
      <button
        type="button"
        className="row-head"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="pip" title={`${priorityLabel(todo.priority)} priority`} />
        <span className="row-main">
          <span className="row-title">{todo.title}</span>
          <span className="row-sub">{subline}</span>
        </span>
        <span className="row-right">
          <span className="count">
            {todo.doneCount}/{todo.totalCount}
          </span>
          <span className="row-bar">
            <span style={{ width: `${Math.round(todo.progress * 100)}%` }} />
          </span>
        </span>
      </button>

      {open && (
        <div className="row-panel">
          {todo.steps.length === 0 ? (
            <p className="desc">
              No steps yet.{" "}
              <Link className="link" href={`/todo/${todo.id}`}>
                Add some
              </Link>
            </p>
          ) : (
            <StepList steps={todo.steps} nextSteps={todo.nextSteps} />
          )}

          <div className="row-actions">
            <Link className="link" href={`/todo/${todo.id}`}>
              Edit todo
            </Link>
            <span className="count">{priorityLabel(todo.priority)} priority</span>
          </div>
        </div>
      )}
    </div>
  );
}
