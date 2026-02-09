import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { projects, tasks, tags, taskTags, comments, activityLog } from "./schema";

async function seed() {
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  // Clean
  await db.delete(taskTags);
  await db.delete(comments);
  await db.delete(activityLog);
  await db.delete(tasks);
  await db.delete(projects);
  await db.delete(tags);

  // Tags
  const [tBug, tFeature, tUrgent, tDesign, tBackend] = await db
    .insert(tags)
    .values([
      { name: "Bug", color: "#ef4444" },
      { name: "Feature", color: "#3b82f6" },
      { name: "Urgent", color: "#f97316" },
      { name: "Design", color: "#a855f7" },
      { name: "Backend", color: "#22c55e" },
    ])
    .returning();

  // Projects
  const [p1, p2, p3] = await db
    .insert(projects)
    .values([
      { name: "Cody Dashboard", description: "Task-Tracking Dashboard für Cody" },
      { name: "OpenClaw Plugins", description: "Plugin-Entwicklung für OpenClaw" },
      { name: "Website Redesign", description: "Corporate Website neu gestalten" },
    ])
    .returning();

  // Tasks
  const [t1, t2, t3, t4, t5, t6, t7, t8] = await db
    .insert(tasks)
    .values([
      { title: "Dashboard UI bauen", description: "Sidebar, Dark Mode, responsive Layout", status: "in_progress" as const, priority: "high" as const, projectId: p1.id, dueDate: new Date("2026-02-15") },
      { title: "API Routes erstellen", description: "CRUD für alle Entitäten", status: "done" as const, priority: "high" as const, projectId: p1.id, dueDate: new Date("2026-02-12") },
      { title: "Kanban Board implementieren", description: "Drag & Drop mit hello-pangea/dnd", status: "open" as const, priority: "medium" as const, projectId: p1.id, dueDate: new Date("2026-02-18") },
      { title: "Auth System einbauen", status: "open" as const, priority: "medium" as const, projectId: p1.id },
      { title: "Plugin API dokumentieren", status: "done" as const, priority: "medium" as const, projectId: p2.id },
      { title: "Webhook Integration", description: "Discord + Slack Webhooks", status: "open" as const, priority: "low" as const, projectId: p2.id, dueDate: new Date("2026-02-20") },
      { title: "Homepage Design", description: "Neues Hero-Section + Navigation", status: "in_progress" as const, priority: "high" as const, projectId: p3.id, dueDate: new Date("2026-02-08") },
      { title: "Performance Audit", description: "Lighthouse Score verbessern", status: "open" as const, priority: "low" as const, projectId: p3.id },
    ])
    .returning();

  // Task Tags
  await db.insert(taskTags).values([
    { taskId: t1.id, tagId: tFeature.id },
    { taskId: t1.id, tagId: tDesign.id },
    { taskId: t2.id, tagId: tBackend.id },
    { taskId: t3.id, tagId: tFeature.id },
    { taskId: t6.id, tagId: tBackend.id },
    { taskId: t7.id, tagId: tDesign.id },
    { taskId: t7.id, tagId: tUrgent.id },
  ]);

  // Comments
  await db.insert(comments).values([
    { taskId: t1.id, content: "Sidebar Navigation ist fertig, Dark Mode läuft.", author: "Cody" },
    { taskId: t1.id, content: "shadcn/ui Komponenten hinzugefügt.", author: "Cody" },
    { taskId: t7.id, content: "Erster Entwurf steht, Feedback ausstehend.", author: "Bro" },
    { taskId: t3.id, content: "hello-pangea/dnd als Library ausgewählt.", author: "Cody" },
  ]);

  // Activity Log
  await db.insert(activityLog).values([
    { action: "created", entityType: "project", entityId: p1.id, entityTitle: p1.name },
    { action: "created", entityType: "project", entityId: p2.id, entityTitle: p2.name },
    { action: "created", entityType: "project", entityId: p3.id, entityTitle: p3.name },
    { action: "created", entityType: "task", entityId: t1.id, entityTitle: t1.title },
    { action: "status_changed", entityType: "task", entityId: t2.id, entityTitle: t2.title, details: "open → done" },
    { action: "comment_added", entityType: "task", entityId: t1.id, entityTitle: t1.title, details: "Sidebar Navigation ist fertig" },
    { action: "tag_added", entityType: "task", entityId: t7.id, entityTitle: t7.title, details: "Urgent" },
  ]);

  console.log("✅ Seed complete — 3 projects, 8 tasks, 5 tags, 4 comments, 7 activity entries");
  await client.end();
}

seed();
