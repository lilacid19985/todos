"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { clampPriority } from "./priority";

type StepInput = {
  id: string | null;
  title: string;
  mine: boolean;
  done: boolean;
  unlinked: boolean;
};

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readSteps(form: FormData): StepInput[] {
  const ids = form.getAll("stepId");
  const titles = form.getAll("stepTitle");
  const owners = form.getAll("stepMine");
  const states = form.getAll("stepDone");
  const links = form.getAll("stepUnlinked");

  const steps: StepInput[] = [];
  titles.forEach((raw, index) => {
    const title = typeof raw === "string" ? raw.trim() : "";
    if (!title) return;
    const id = ids[index];
    steps.push({
      id: typeof id === "string" && id ? id : null,
      title,
      mine: owners[index] !== "0",
      done: states[index] === "1",
      // Nothing comes before the first step, so it can't be unlinked from
      // anything — blank rows dropping out can shift a step into that slot.
      unlinked: steps.length > 0 && links[index] === "1",
    });
  });
  return steps;
}

async function writeSteps(todoId: string, steps: StepInput[]) {
  // Keep the original completion time for steps that were already done, so
  // re-saving a todo doesn't reshuffle the completed list.
  const existing = await prisma.step.findMany({
    where: { todoId },
    select: { id: true, doneAt: true },
  });
  const previousDoneAt = new Map(existing.map((step) => [step.id, step.doneAt]));

  const keep = steps.map((s) => s.id).filter((id): id is string => Boolean(id));
  await prisma.step.deleteMany({ where: { todoId, id: { notIn: keep } } });

  for (const [position, step] of steps.entries()) {
    const doneAt = step.done
      ? (step.id ? previousDoneAt.get(step.id) : null) ?? new Date()
      : null;

    if (step.id) {
      await prisma.step.update({
        where: { id: step.id },
        data: {
          title: step.title,
          position,
          mine: step.mine,
          done: step.done,
          unlinked: step.unlinked,
          doneAt,
        },
      });
    } else {
      await prisma.step.create({
        data: {
          todoId,
          title: step.title,
          position,
          mine: step.mine,
          done: step.done,
          unlinked: step.unlinked,
          doneAt,
        },
      });
    }
  }
}

export async function createTodo(form: FormData) {
  const title = text(form, "title");
  if (!title) return;

  const todo = await prisma.todo.create({
    data: { title, priority: clampPriority(form.get("priority")) },
  });

  await writeSteps(todo.id, readSteps(form));
  revalidatePath("/");
  redirect("/");
}

export async function updateTodo(form: FormData) {
  const id = text(form, "id");
  const title = text(form, "title");
  if (!id || !title) return;

  await prisma.todo.update({
    where: { id },
    data: { title, priority: clampPriority(form.get("priority")) },
  });

  await writeSteps(id, readSteps(form));
  revalidatePath("/");
  redirect("/");
}

export async function deleteTodo(form: FormData) {
  const id = text(form, "id");
  if (!id) return;
  await prisma.todo.delete({ where: { id } });
  revalidatePath("/");
  redirect("/");
}

/**
 * Deliberately doesn't revalidate. The write lands immediately, but a checked
 * step that's still on screen would be yanked out from under you the moment
 * the board re-read the database — so the caller decides when the list catches
 * up, once its tick has had time to be seen.
 */
export async function toggleStep(stepId: string, done: boolean) {
  await prisma.step.update({
    where: { id: stepId },
    data: { done, doneAt: done ? new Date() : null },
  });
}
