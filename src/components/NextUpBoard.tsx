"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CardView, TodoView } from "@/lib/queries";
import { priorityLabel, priorityStyle } from "@/lib/priority";
import StepCheck from "./StepCheck";
import StepList from "./StepList";

function Card({ card, onOpen }: { card: CardView; onOpen: () => void }) {
  const { todo, step } = card;
  // A todo with unlinked steps has more than one thing open at once, so it
  // gets a card each. The badge says why the same title shows up twice.
  const atOnce = todo.nextSteps.length;
  // Priority left with the rail, so the footer can now come out empty.
  const waiting = Boolean(step && !step.mine);
  const hasFoot = waiting || atOnce > 1 || todo.totalCount === 0;
  // Ticked off, but the card hasn't dropped out of the list yet.
  const [struck, setStruck] = useState(false);

  return (
    <div
      className="card"
      style={priorityStyle(todo.priority)}
      role="button"
      tabIndex={0}
      title={`${priorityLabel(todo.priority)} priority`}
      aria-label={`Open ${todo.title} — ${priorityLabel(todo.priority)} priority`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <span className="prio-mark corner" aria-hidden="true" />

      {step ? (
        // Checking off here must not also open the modal.
        <span onClick={(event) => event.stopPropagation()}>
          <StepCheck id={step.id} done={false} onToggle={setStruck} />
        </span>
      ) : (
        <span className="box" style={{ opacity: 0.3 }} aria-hidden="true" />
      )}

      <div className="card-body">
        <div className={`card-step${struck ? " struck" : ""}`}>
          {step ? step.title : "No steps yet"}
        </div>
        <div className="card-parent">{todo.title}</div>
        {hasFoot && (
          <div className="card-foot">
            {waiting && <span className="badge waiting">Someone else</span>}
            {atOnce > 1 && <span className="badge parallel">{atOnce} at once</span>}
            {todo.totalCount === 0 && (
              <span className="badge empty-state">Add steps</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NextUpBoard({
  cards,
  completed,
}: {
  cards: CardView[];
  completed: TodoView[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Completed todos are included so an open modal survives its last step
  // being checked off, which drops the todo out of the active list.
  const lookup = useMemo(() => {
    const map = new Map<string, TodoView>();
    for (const card of cards) map.set(card.todo.id, card.todo);
    for (const todo of completed) map.set(todo.id, todo);
    return map;
  }, [cards, completed]);

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
      <div className="board">
        {cards.map((card) => (
          <Card key={card.id} card={card} onOpen={() => setOpenId(card.todo.id)} />
        ))}
      </div>

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
