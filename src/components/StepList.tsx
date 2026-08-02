"use client";

import type { StepView } from "@/lib/queries";
import StepCheck from "./StepCheck";

/**
 * The whole plan, in order. Numbers are stages, not positions — steps that
 * run alongside each other share a number, and the ones after the first in a
 * stage are marked "+" and tucked under it without a divider.
 */
export default function StepList({
  steps,
  nextSteps,
}: {
  steps: StepView[];
  nextSteps: StepView[];
}) {
  const next = new Set(nextSteps.map((step) => step.id));

  return (
    <ol className="steps">
      {steps.map((step) => (
        <li
          key={step.id}
          className={`step ${step.done ? "done" : "pending"}${
            next.has(step.id) ? " next" : ""
          }${step.unlinked ? " joined" : ""}`}
        >
          <span
            className="step-num"
            title={step.unlinked ? "Runs alongside the step above" : undefined}
          >
            {step.unlinked ? "+" : String(step.stage + 1).padStart(2, "0")}
          </span>
          <StepCheck id={step.id} done={step.done} small />
          <span className="step-text">{step.title}</span>
          {!step.mine && <span className="step-who">someone else</span>}
        </li>
      ))}
    </ol>
  );
}
