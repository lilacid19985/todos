"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CardGroup, CardView, TodoView } from "@/lib/queries";
import { priorityLabel, priorityStyle } from "@/lib/priority";
import StepCheck from "./StepCheck";
import StepList from "./StepList";

function Card({
  card,
  isHero,
  onOpen,
}: {
  card: CardView;
  isHero: boolean;
  onOpen: () => void;
}) {
  const { todo, step } = card;
  // A todo with unlinked steps has more than one thing open at once, so it
  // gets a card each. The badge says why the same title shows up twice.
  const atOnce = todo.nextSteps.length;

  return (
    <div
      className={`card${isHero ? " is-hero" : ""}`}
      style={priorityStyle(todo.priority)}
      role="button"
      tabIndex={0}
      aria-label={`Open ${todo.title}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      {step ? (
        // Checking off here must not also open the modal.
        <span onClick={(event) => event.stopPropagation()}>
          <StepCheck id={step.id} done={false} />
        </span>
      ) : (
        <span className="box" style={{ opacity: 0.3 }} aria-hidden="true" />
      )}

      <div className="card-body">
        <div className="card-step">{step ? step.title : "No steps yet"}</div>
        <div className="card-parent">{todo.title}</div>
        <div className="card-foot">
          {step && !step.mine && <span className="badge waiting">Someone else</span>}
          {atOnce > 1 && <span className="badge parallel">{atOnce} at once</span>}
          <span className="badge prio">{priorityLabel(todo.priority)}</span>
          {todo.totalCount === 0 && <span className="badge empty-state">Add steps</span>}
        </div>
      </div>
    </div>
  );
}

export default function NextUpBoard({
  groups,
  completed,
  heroId,
}: {
  groups: CardGroup[];
  completed: TodoView[];
  heroId: string | null;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Completed todos are included so an open modal survives its last step
  // being checked off, which moves the todo out of the active groups.
  const lookup = useMemo(() => {
    const map = new Map<string, TodoView>();
    for (const group of groups) for (const card of group.cards) map.set(card.todo.id, card.todo);
    for (const todo of completed) map.set(todo.id, todo);
    return map;
  }, [groups, completed]);

  const open = openId ? lookup.get(openId) ?? null : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {groups.map((group) => (
        <div key={group.key}>
          {group.label && <div className="group-label">{group.label}</div>}
          <div className="board">
            {group.cards.map((card) => (
              <Card
                key={card.id}
                card={card}
                isHero={card.id === heroId}
                onOpen={() => setOpenId(card.todo.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {open && (
        <div className="overlay" role="presentation" onClick={() => setOpenId(null)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={open.title}
            style={priorityStyle(open.priority)}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div className="modal-title">
                {open.title}
                <div className="modal-meta">
                  <span className="badge prio">
                    {priorityLabel(open.priority)} priority
                  </span>
                  {open.complete && <span className="badge done">Complete</span>}
                </div>
              </div>
              <div className="modal-tools">
                <Link className="tool" href={`/todo/${open.id}`}>
                  Edit
                </Link>
                <button
                  type="button"
                  className="tool x"
                  onClick={() => setOpenId(null)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="modal-body">
              {open.totalCount > 0 && (
                <div className="progress">
                  <div className={`bar${open.complete ? " done" : ""}`}>
                    <span style={{ width: `${Math.round(open.progress * 100)}%` }} />
                  </div>
                  <span className="count">
                    {open.doneCount}/{open.totalCount} done
                  </span>
                </div>
              )}

              {open.steps.length === 0 ? (
                <p className="desc">
                  This todo has no steps yet, so nothing can be checked off.{" "}
                  <Link className="link" href={`/todo/${open.id}`}>
                    Add some
                  </Link>
                  .
                </p>
              ) : (
                <StepList steps={open.steps} nextSteps={open.nextSteps} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
