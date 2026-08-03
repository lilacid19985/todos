"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toggleStep, toggleTodo } from "@/lib/actions";

/** How long a checked box sits there showing its tick before the list moves on. */
const SETTLE_MS = 3000;

export default function Check({
  id,
  kind = "step",
  done,
  small = false,
  onToggle,
}: {
  id: string;
  /** A one-off todo has no step to tick, so the tick lands on the todo itself. */
  kind?: "step" | "todo";
  done: boolean;
  small?: boolean;
  /** Reports the box's own state, so the row can strike its title to match. */
  onToggle?: (checked: boolean) => void;
}) {
  const router = useRouter();
  // What the box shows right now. The database is told straight away; this is
  // what carries the green tick until the board is refreshed to match.
  const [checked, setChecked] = useState(done);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Once the refresh lands, the server is the truth again.
  useEffect(() => setChecked(done), [done]);

  // Leaving the page mid-wait shouldn't fire a refresh into nothing.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <button
      type="button"
      className={`box${checked ? " checked" : ""}${small ? " sm" : ""}`}
      aria-pressed={checked}
      aria-label={checked ? "Mark not done" : "Mark done"}
      onClick={() => {
        const next = !checked;
        setChecked(next);
        onToggle?.(next);
        const write = kind === "todo" ? toggleTodo(id, next) : toggleStep(id, next);
        // If the write fails the tick has to come back off, or it would claim
        // something got done that didn't.
        write.catch(() => {
          setChecked(!next);
          onToggle?.(!next);
        });

        // Changing your mind inside the window restarts it rather than
        // stacking up refreshes.
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => router.refresh(), SETTLE_MS);
      }}
    >
      ✓
    </button>
  );
}
