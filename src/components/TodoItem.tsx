"use client";

import Link from "next/link";
import { useState } from "react";
import type { TodoView } from "@/lib/queries";
import { priorityLabel, priorityStyle } from "@/lib/priority";
import OneOff from "./OneOff";
import StepList from "./StepList";

export default function TodoItem({ todo }: { todo: TodoView }) {
  const [open, setOpen] = useState(false);

  let subline: string;
  if (todo.complete) subline = "Complete";
  else if (todo.simple) subline = "One-off";
  else if (todo.nextSteps.length > 1) {
    const titles = todo.nextSteps.map((step) => step.title).join(" · ");
    subline = `Next (${todo.nextSteps.length} at once): ${titles}`;
  } else if (todo.nextSteps.length === 1) {
    const [step] = todo.nextSteps;
    subline = `Next: ${step.title}${step.mine ? "" : " · someone else"}`;
  } else subline = "Nothing open";

  // Nothing to count or fill on a one-off — it's one thing, done or not.

  return (
    <div
      className="row"
      style={priorityStyle(todo.priority)}
      title={`${priorityLabel(todo.priority)} priority`}
    >
      <button
        type="button"
        className="row-head"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="row-main">
          <span className="row-title">{todo.title}</span>
          <span className="row-sub">{subline}</span>
        </span>
        <span className="row-right">
          {!todo.simple && (
            <>
              <span className="count">
                {todo.doneCount}/{todo.totalCount}
              </span>
              <span className="row-bar">
                <span style={{ width: `${Math.round(todo.progress * 100)}%` }} />
              </span>
            </>
          )}
          <span className="prio-mark" aria-hidden="true" />
        </span>
      </button>

      {open && (
        <div className="row-panel">
          {todo.simple ? (
            <OneOff todo={todo} />
          ) : (
            <StepList steps={todo.steps} nextSteps={todo.nextSteps} />
          )}

          <div className="row-actions">
            <Link className="link" href={`/todo/${todo.id}`}>
              Edit todo
            </Link>
            <span className="badge prio">{priorityLabel(todo.priority)} priority</span>
          </div>
        </div>
      )}
    </div>
  );
}
