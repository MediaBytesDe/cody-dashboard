import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { projects, tasks } from "./schema";

async function seed() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const [p1, p2] = await db
    .insert(projects)
    .values([
      { name: "Cody Dashboard", description: "Task-Tracking Dashboard für Cody" },
      { name: "OpenClaw Plugins", description: "Plugin-Entwicklung für OpenClaw" },
    ])
    .returning();

  await db.insert(tasks).values([
    { title: "Dashboard UI bauen", status: "in_progress", priority: "high", projectId: p1.id, dueDate: new Date("2026-02-15") },
    { title: "API Routes erstellen", status: "open", priority: "high", projectId: p1.id, dueDate: new Date("2026-02-12") },
    { title: "Auth System", status: "open", priority: "medium", projectId: p1.id },
    { title: "Plugin API dokumentieren", status: "done", priority: "medium", projectId: p2.id },
    { title: "Webhook Integration", status: "open", priority: "low", projectId: p2.id, dueDate: new Date("2026-02-20") },
  ]);

  console.log("✅ Seed complete");
  await client.end();
}

seed();
