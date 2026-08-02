// Sample data so a fresh install isn't an empty screen.
// Safe to re-run: it does nothing if any todos already exist.
// Run with: node prisma/seed.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if ((await prisma.todo.count()) > 0) {
    console.log("Todos already exist — leaving the database alone.");
    return;
  }

  // [title, mine, done, unlinked] — unlinked means "runs alongside the step
  // above" instead of after it, so both come up at once.
  const todos = [
    {
      title: "Dinner",
      priority: 2,
      steps: [
        ["Make a grocery list", true, true],
        ["Go to the store", true, true],
        ["Buy it", true, false],
        ["Make it", true, false],
        ["Eat it", true, false],
        ["Clean up after", false, false],
      ],
    },
    {
      title: "Ship the landing page",
      priority: 1,
      steps: [
        ["Write the copy", true, true],
        ["Wait for Sam to send the design", false, false],
        // Doesn't wait on Sam — this and the design come up together, and
        // "Build it out" waits on both.
        ["Set up the analytics account", true, false, true],
        ["Build it out", true, false],
        ["Deploy and check analytics", true, false],
      ],
    },
    {
      title: "Renew car registration",
      priority: 3,
      steps: [
        ["Find the renewal notice", true, false],
        ["Pay online", true, false],
      ],
    },
    {
      title: "Fix the leaky tap",
      priority: 5,
      steps: [
        ["Buy a new washer", true, true],
        ["Swap it in", true, true],
      ],
    },
  ];

  for (const todo of todos) {
    await prisma.todo.create({
      data: {
        title: todo.title,
        priority: todo.priority,
        steps: {
          create: todo.steps.map(([title, mine, done, unlinked], position) => ({
            title,
            position,
            mine,
            done,
            unlinked: position > 0 && Boolean(unlinked),
            doneAt: done ? new Date() : null,
          })),
        },
      },
    });
  }

  console.log(`Seeded ${todos.length} todos.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
