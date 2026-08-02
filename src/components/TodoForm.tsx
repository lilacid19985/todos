"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TodoView } from "@/lib/queries";
import { DEFAULT_PRIORITY, PRIORITIES } from "@/lib/priority";

type Draft = {
  key: number;
  id: string | null;
  title: string;
  mine: boolean;
  done: boolean;
  unlinked: boolean;
};
type Action = (formData: FormData) => void | Promise<void>;

const EXAMPLES = ["Make a grocery list", "Go to the store", "Buy it"];

/** A chain link, or the same link snapped in two. */
function Chain({ broken }: { broken: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {broken ? (
        <>
          <path d="M18.84 12.25l1.72-1.71a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M5.17 11.75l-1.71 1.71a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          <path d="M8 2v2.5M2 8h2.5M16 19.5V22M19.5 16H22" />
        </>
      ) : (
        <>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </>
      )}
    </svg>
  );
}

export default function TodoForm({
  action,
  deleteAction,
  todo,
}: {
  action: Action;
  deleteAction?: Action;
  todo?: TodoView;
}) {
  const counter = useRef(0);
  const priorityRef = useRef<HTMLSelectElement>(null);
  const stepRefs = useRef(new Map<number, HTMLInputElement | null>());
  const [pendingFocus, setPendingFocus] = useState<number | null>(null);

  // Dragging is only armed while the grab handle is held, so the text
  // inputs keep their normal click-and-select behaviour.
  const [dragArmed, setDragArmed] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const blank = (): Draft => ({
    key: counter.current++,
    id: null,
    title: "",
    mine: true,
    done: false,
    unlinked: false,
  });

  const [steps, setSteps] = useState<Draft[]>(() => {
    if (todo?.steps.length) {
      return todo.steps.map((step) => ({
        key: counter.current++,
        id: step.id,
        title: step.title,
        mine: step.mine,
        done: step.done,
        unlinked: step.unlinked,
      }));
    }
    return [blank(), blank(), blank()];
  });

  // Focus a row only once it has actually rendered.
  useEffect(() => {
    if (pendingFocus === null) return;
    stepRefs.current.get(pendingFocus)?.focus();
    setPendingFocus(null);
  }, [pendingFocus, steps]);

  const patch = (index: number, changes: Partial<Draft>) =>
    setSteps((current) =>
      current.map((step, i) => (i === index ? { ...step, ...changes } : step))
    );

  const addStep = () => {
    const step = blank();
    setSteps((current) => [...current, step]);
    setPendingFocus(step.key);
  };

  /** Nothing runs before the first step, so it can never be unlinked. */
  const relinkFirst = (list: Draft[]) =>
    list[0]?.unlinked
      ? list.map((step, i) => (i === 0 ? { ...step, unlinked: false } : step))
      : list;

  const removeStep = (index: number) =>
    setSteps((current) =>
      current.length === 1
        ? [blank()]
        : relinkFirst(current.filter((_, i) => i !== index))
    );

  const moveTo = (from: number, to: number) =>
    setSteps((current) => {
      if (to < 0 || to >= current.length || from === to) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return relinkFirst(next);
    });

  const endDrag = () => {
    setDragIndex(null);
    setDragArmed(false);
  };

  /** Enter always advances; only the buttons at the bottom submit. */
  const onStepEnter = (index: number) => {
    const next = steps[index + 1];
    if (next) {
      stepRefs.current.get(next.key)?.focus();
      return;
    }
    if (steps[index].title.trim()) addStep();
  };

  const advance = (event: React.KeyboardEvent, to: () => void) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    to();
  };

  return (
    <form className="form" action={action}>
      {todo && <input type="hidden" name="id" value={todo.id} />}

      <div className="field">
        <label className="label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          autoFocus
          maxLength={120}
          placeholder="Dinner"
          defaultValue={todo?.title ?? ""}
          onKeyDown={(event) =>
            advance(event, () => stepRefs.current.get(steps[0]?.key)?.focus())
          }
        />
      </div>

      <div className="field">
        <div className="field-head">
          <span className="label">Steps</span>
        </div>

        <div className="editor">
          {steps.map((step, index) => (
            <div
              key={step.key}
              // A cut row draws a broken divider below it — the step under it
              // runs alongside this one rather than after it.
              className={`editor-row${dragIndex === index ? " dragging" : ""}${
                steps[index + 1]?.unlinked ? " cut" : ""
              }`}
              draggable={dragArmed}
              onDragStart={(event) => {
                setDragIndex(index);
                event.dataTransfer.effectAllowed = "move";
                // Firefox refuses to start a drag without payload.
                event.dataTransfer.setData("text/plain", String(index));
              }}
              onDragOver={(event) => {
                if (dragIndex === null) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (dragIndex !== index) {
                  moveTo(dragIndex, index);
                  setDragIndex(index);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                endDrag();
              }}
              onDragEnd={endDrag}
            >
              <button
                type="button"
                className="grab"
                aria-label="Reorder step — drag, or use arrow keys"
                title="Drag to reorder"
                onMouseDown={() => setDragArmed(true)}
                onMouseUp={() => setDragArmed(false)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    moveTo(index, index - 1);
                  } else if (event.key === "ArrowDown") {
                    event.preventDefault();
                    moveTo(index, index + 1);
                  }
                }}
              >
                ⠿
              </button>

              <input type="hidden" name="stepId" value={step.id ?? ""} />
              <input type="hidden" name="stepMine" value={step.mine ? "1" : "0"} />
              <input type="hidden" name="stepDone" value={step.done ? "1" : "0"} />
              <input
                type="hidden"
                name="stepUnlinked"
                value={step.unlinked ? "1" : "0"}
              />

              <button
                type="button"
                className={`box sm${step.done ? " checked" : ""}`}
                aria-pressed={step.done}
                aria-label={step.done ? "Mark step not done" : "Mark step done"}
                onClick={() => patch(index, { done: !step.done })}
              >
                ✓
              </button>

              <input
                type="text"
                name="stepTitle"
                className={step.done ? "struck" : ""}
                value={step.title}
                maxLength={160}
                placeholder={todo ? "Step" : EXAMPLES[index] ?? "Next step"}
                ref={(element) => {
                  stepRefs.current.set(step.key, element);
                }}
                onChange={(event) => patch(index, { title: event.target.value })}
                onKeyDown={(event) => advance(event, () => onStepEnter(index))}
              />

              <button
                type="button"
                className={`who${step.mine ? "" : " other"}`}
                aria-pressed={!step.mine}
                title="Who is this step on?"
                onClick={() => patch(index, { mine: !step.mine })}
              >
                {step.mine ? "Me" : "Someone else"}
              </button>

              <button
                type="button"
                className={`chain${step.unlinked ? " cut" : ""}`}
                disabled={index === 0}
                aria-pressed={step.unlinked}
                aria-label={
                  step.unlinked
                    ? "Runs alongside the step above — link it back"
                    : "Runs after the step above — unlink it"
                }
                title={
                  index === 0
                    ? "The first step waits on nothing"
                    : step.unlinked
                      ? "Runs alongside the step above — click to link it back"
                      : "Runs after the step above — click to unlink"
                }
                onClick={() => patch(index, { unlinked: !step.unlinked })}
              >
                <Chain broken={step.unlinked} />
              </button>

              <button
                type="button"
                className="icon-btn"
                aria-label="Remove step"
                onClick={() => removeStep(index)}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="editor-add" onClick={addStep}>
            + Add step
          </button>
        </div>
      </div>

      <div className="field narrow">
        <label className="label" htmlFor="priority">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          ref={priorityRef}
          defaultValue={String(todo?.priority ?? DEFAULT_PRIORITY)}
          onKeyDown={(event) => advance(event, () => undefined)}
        >
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="actions">
        <button className="btn" type="submit">
          {todo ? "Save changes" : "Create todo"}
        </button>
        <Link className="btn ghost" href="/">
          Cancel
        </Link>
        <span className="spacer" />
        {deleteAction && (
          <button
            className="btn danger sm"
            type="submit"
            formAction={deleteAction}
            formNoValidate
            onClick={(event) => {
              if (!window.confirm("Delete this todo and all its steps?")) {
                event.preventDefault();
              }
            }}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
