"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TodoView } from "@/lib/queries";
import { DEFAULT_PRIORITY, PRIORITIES, priorityStyle } from "@/lib/priority";

type Draft = {
  key: number;
  id: string | null;
  title: string;
  mine: boolean;
  done: boolean;
  unlinked: boolean;
};
type Action = (formData: FormData) => void | Promise<void>;

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
  const stepRefs = useRef(new Map<number, HTMLInputElement | null>());
  const [pendingFocus, setPendingFocus] = useState<number | null>(null);

  // Dragging runs off pointer events rather than HTML5 drag-and-drop, which
  // no mobile browser fires. The handle captures the pointer, so only it
  // starts a drag and the text inputs keep normal click-and-select.
  const rowRefs = useRef(new Map<number, HTMLDivElement | null>());
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
    return [blank()];
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

  const endDrag = () => setDragIndex(null);

  /** Which row is under this point on the screen right now. */
  const rowAt = (clientY: number): number | null => {
    for (const [index, step] of steps.entries()) {
      const box = rowRefs.current.get(step.key)?.getBoundingClientRect();
      if (box && clientY >= box.top && clientY <= box.bottom) return index;
    }
    return null;
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
          defaultValue={todo?.title ?? ""}
          onKeyDown={(event) =>
            advance(event, () => stepRefs.current.get(steps[0]?.key)?.focus())
          }
        />
      </div>

      <div className="field">
        <div className="field-head">
          <span className="label">Steps</span>
          <span className="hint">Leave empty for a one-off — a todo on its own</span>
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
              ref={(element) => {
                rowRefs.current.set(step.key, element);
              }}
            >
              <button
                type="button"
                className="grab"
                aria-label="Reorder step — drag, or use arrow keys"
                title="Drag to reorder"
                onPointerDown={(event) => {
                  // Capture sends every later move here even when the finger
                  // leaves the handle, which it immediately does.
                  event.preventDefault();
                  event.currentTarget.setPointerCapture(event.pointerId);
                  event.currentTarget.focus();
                  setDragIndex(index);
                }}
                onPointerMove={(event) => {
                  if (dragIndex === null) return;
                  const to = rowAt(event.clientY);
                  if (to !== null && to !== dragIndex) {
                    moveTo(dragIndex, to);
                    setDragIndex(to);
                  }
                }}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
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
                placeholder="Step"
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

      <div className="field">
        <span className="label">Priority</span>
        {/* Each choice wears the colour it will give the card, so you're
            picking the rail you'll actually be reading later. */}
        <div
          className="prios"
          role="radiogroup"
          aria-label="Priority"
          onKeyDown={(event) => advance(event, () => undefined)}
        >
          {PRIORITIES.map((p) => (
            <label key={p.value} className="prio-pick" style={priorityStyle(p.value)}>
              <input
                type="radio"
                name="priority"
                value={p.value}
                defaultChecked={p.value === (todo?.priority ?? DEFAULT_PRIORITY)}
              />
              <span className="prio-face">{p.label}</span>
            </label>
          ))}
        </div>
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
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
