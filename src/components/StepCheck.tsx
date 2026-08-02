"use client";

import { useTransition } from "react";
import { toggleStep } from "@/lib/actions";

export default function StepCheck({
  id,
  done,
  small = false,
}: {
  id: string;
  done: boolean;
  small?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={`box${done ? " checked" : ""}${small ? " sm" : ""}${
        pending ? " busy" : ""
      }`}
      aria-pressed={done}
      aria-label={done ? "Mark step not done" : "Mark step done"}
      onClick={() =>
        startTransition(async () => {
          await toggleStep(id, !done);
        })
      }
    >
      ✓
    </button>
  );
}
