import type { CSSProperties } from "react";

export const PRIORITIES = [
  { value: 1, label: "Highest" },
  { value: 2, label: "High" },
  { value: 3, label: "Medium" },
  { value: 4, label: "Low" },
  { value: 5, label: "Lowest" },
] as const;

export const DEFAULT_PRIORITY = 3;

export function priorityLabel(value: number): string {
  return PRIORITIES.find((p) => p.value === value)?.label ?? "Medium";
}

/** Each level gets its own colour, defined as --p1..--p5 in globals.css. */
export function priorityVar(value: number): string {
  const level = Math.max(1, Math.min(5, Math.round(value)));
  return `var(--p${level})`;
}

/** Inline style that scopes a priority colour to an element and its children. */
export function priorityStyle(value: number): CSSProperties {
  return { ["--prio"]: priorityVar(value) } as CSSProperties;
}

export function clampPriority(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_PRIORITY;
  return Math.max(1, Math.min(5, Math.round(n)));
}
