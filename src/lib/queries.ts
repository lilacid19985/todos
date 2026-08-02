import { prisma } from "./db";

export type SortKey = "priority" | "progress" | "owner";

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "priority", label: "Priority" },
  { key: "progress", label: "Closest to done" },
  { key: "owner", label: "Owner" },
];

export function parseSort(value: unknown): SortKey {
  return SORTS.some((s) => s.key === value) ? (value as SortKey) : "priority";
}

export type StepView = {
  id: string;
  title: string;
  done: boolean;
  position: number;
  mine: boolean;
  /** true = cut loose from the step before it, so the two run side by side. */
  unlinked: boolean;
  /** Steps sharing a stage can all be worked on at the same time. */
  stage: number;
};

export type TodoView = {
  id: string;
  title: string;
  priority: number;
  steps: StepView[];
  doneCount: number;
  totalCount: number;
  progress: number;
  complete: boolean;
  /** Everything that's open right now — the whole current stage. */
  nextSteps: StepView[];
  completedAt: number | null;
};

export type Group = { key: string; label: string; todos: TodoView[] };

/** One next-up card: a todo plus the one open step the card is about. */
export type CardView = { id: string; todo: TodoView; step: StepView | null };

export type CardGroup = { key: string; label: string; cards: CardView[] };

function toView(todo: {
  id: string;
  title: string;
  priority: number;
  steps: {
    id: string;
    title: string;
    done: boolean;
    position: number;
    mine: boolean;
    unlinked: boolean;
    doneAt: Date | null;
  }[];
}): TodoView {
  // Walk the steps in order and cut them into stages. A linked step starts a
  // new stage — it waits on everything before it. An unlinked step joins the
  // stage of the step above instead, so the two run alongside each other.
  const steps: StepView[] = [];
  let stage = -1;
  for (const s of todo.steps) {
    const unlinked = steps.length > 0 && s.unlinked;
    if (!unlinked) stage += 1;
    steps.push({
      id: s.id,
      title: s.title,
      done: s.done,
      position: s.position,
      mine: s.mine,
      unlinked,
      stage,
    });
  }

  const totalCount = steps.length;
  const doneCount = steps.filter((s) => s.done).length;
  const complete = totalCount > 0 && doneCount === totalCount;
  const completedAt = complete
    ? Math.max(...todo.steps.map((s) => s.doneAt?.getTime() ?? 0))
    : null;

  // The earliest stage still holding open steps is what's open now — all of
  // it, since nothing inside a stage waits on anything else inside it.
  const openStage = steps.find((s) => !s.done)?.stage ?? null;
  const nextSteps =
    openStage === null ? [] : steps.filter((s) => !s.done && s.stage === openStage);

  return {
    id: todo.id,
    title: todo.title,
    priority: todo.priority,
    steps,
    doneCount,
    totalCount,
    progress: totalCount === 0 ? 0 : doneCount / totalCount,
    complete,
    nextSteps,
    completedAt,
  };
}

function byPriority(a: TodoView, b: TodoView): number {
  return a.priority - b.priority || a.title.localeCompare(b.title);
}

function byProgress(a: TodoView, b: TodoView): number {
  return b.progress - a.progress || byPriority(a, b);
}

/** A todo is on you if there's anything at all you can do right now. */
function onMe(todo: TodoView): boolean {
  return todo.nextSteps.some((step) => step.mine);
}

/** Splits into what's on me vs. what I'm waiting on someone else for. */
function groupByOwner(todos: TodoView[]): Group[] {
  const mine: TodoView[] = [];
  const theirs: TodoView[] = [];
  const idle: TodoView[] = [];

  for (const todo of todos) {
    if (!todo.nextSteps.length) idle.push(todo);
    else if (onMe(todo)) mine.push(todo);
    else theirs.push(todo);
  }

  return [
    { key: "mine", label: "On me", todos: mine.sort(byPriority) },
    { key: "theirs", label: "Waiting on someone else", todos: theirs.sort(byPriority) },
    { key: "idle", label: "No steps yet", todos: idle.sort(byPriority) },
  ].filter((group) => group.todos.length > 0);
}

/** One card per open step, so parallel steps each get their own. */
function cardsFor(todo: TodoView): CardView[] {
  if (!todo.nextSteps.length) return [{ id: todo.id, todo, step: null }];
  return todo.nextSteps.map((step) => ({ id: step.id, todo, step }));
}

/** Same split as groupByOwner, but per card — a todo can land in both. */
function cardsByOwner(cards: CardView[]): CardGroup[] {
  return [
    {
      key: "mine",
      label: "On me",
      cards: cards.filter((card) => card.step?.mine),
    },
    {
      key: "theirs",
      label: "Waiting on someone else",
      cards: cards.filter((card) => card.step && !card.step.mine),
    },
    { key: "idle", label: "No steps yet", cards: cards.filter((card) => !card.step) },
  ].filter((group) => group.cards.length > 0);
}

export async function getBoard(sort: SortKey) {
  const rows = await prisma.todo.findMany({
    include: { steps: { orderBy: { position: "asc" } } },
  });

  const views = rows.map(toView);
  const active = views.filter((t) => !t.complete);
  const completed = views
    .filter((t) => t.complete)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  const ranked = [...active].sort(sort === "progress" ? byProgress : byPriority);

  let groups: Group[];
  let cardGroups: CardGroup[];
  if (sort === "owner") {
    groups = groupByOwner(active);
    cardGroups = cardsByOwner([...active].sort(byPriority).flatMap(cardsFor));
  } else {
    groups = ranked.length ? [{ key: "all", label: "", todos: ranked }] : [];
    const cards = ranked.flatMap(cardsFor);
    cardGroups = cards.length ? [{ key: "all", label: "", cards }] : [];
  }

  // The outlined card ignores the chosen sort — it always answers "what's
  // most important right now", which is the highest-priority open step.
  const top = [...active].filter((t) => t.nextSteps.length).sort(byPriority)[0];

  return {
    groups,
    cardGroups,
    completed,
    activeCount: active.length,
    heroId: top?.nextSteps[0].id ?? null,
  };
}

export async function getTodo(id: string) {
  const todo = await prisma.todo.findUnique({
    where: { id },
    include: { steps: { orderBy: { position: "asc" } } },
  });
  return todo ? toView(todo) : null;
}
