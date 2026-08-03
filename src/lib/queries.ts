import { prisma } from "./db";

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

/** One next-up card: a todo plus the one open step the card is about. */
export type CardView = { id: string; todo: TodoView; step: StepView | null };

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

/**
 * The only ordering in the app, and it isn't a choice: what you can act on now
 * comes first, then what someone else owes you, then todos with nothing
 * planned. It's one list, not three sections — the band decides the broad
 * order and priority decides everything inside it, so your own work always
 * floats to the top without anything being labelled or fenced off.
 */
function band(mine: boolean, open: boolean): number {
  if (!open) return 2;
  return mine ? 0 : 1;
}

function todoBand(todo: TodoView): number {
  return band(
    todo.nextSteps.some((step) => step.mine),
    todo.nextSteps.length > 0,
  );
}

function byDefault(a: TodoView, b: TodoView): number {
  return todoBand(a) - todoBand(b) || byPriority(a, b);
}

/** One card per open step, so parallel steps each get their own. */
function cardsFor(todo: TodoView): CardView[] {
  if (!todo.nextSteps.length) return [{ id: todo.id, todo, step: null }];
  return todo.nextSteps.map((step) => ({ id: step.id, todo, step }));
}

/**
 * Per card rather than per todo, since one todo can have a step on you and a
 * step on someone else open at the same time — those two cards belong in
 * different parts of the list.
 */
function byCard(a: CardView, b: CardView): number {
  const rank = (card: CardView) =>
    band(Boolean(card.step?.mine), Boolean(card.step));
  return rank(a) - rank(b) || byPriority(a.todo, b.todo);
}

export async function getBoard() {
  const rows = await prisma.todo.findMany({
    include: { steps: { orderBy: { position: "asc" } } },
  });

  const views = rows.map(toView);
  const active = views.filter((t) => !t.complete).sort(byDefault);
  const completed = views
    .filter((t) => t.complete)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  // Sorting is stable, so two cards off the same todo keep their step order.
  const cards = active.flatMap(cardsFor).sort(byCard);

  return { todos: active, cards, completed, activeCount: active.length };
}

export async function getTodo(id: string) {
  const todo = await prisma.todo.findUnique({
    where: { id },
    include: { steps: { orderBy: { position: "asc" } } },
  });
  return todo ? toView(todo) : null;
}
