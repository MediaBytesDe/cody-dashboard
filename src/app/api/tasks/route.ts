import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const allTasks = await db.query.tasks.findMany({
    with: { taskTags: { with: { tag: true } } },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  return NextResponse.json(allTasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [task] = await db.insert(tasks).values({
    title: body.title,
    description: body.description || null,
    status: body.status || "open",
    priority: body.priority || "medium",
    projectId: body.projectId || null,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
    startDate: body.startDate ? new Date(body.startDate) : null,
    recurringPattern: body.recurringPattern || null,
  }).returning();
  await logActivity("created", "task", task.id, task.title);
  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);
  if (updates.dueDate === null) updates.dueDate = null;
  if (updates.startDate) updates.startDate = new Date(updates.startDate);
  if (updates.startDate === null) updates.startDate = null;

  const [old] = await db.select().from(tasks).where(eq(tasks.id, id));
  const [task] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();

  if (updates.status && old && updates.status !== old.status) {
    await logActivity("status_changed", "task", task.id, task.title, `${old.status} → ${updates.status}`);
  } else if (updates.pinned !== undefined) {
    await logActivity("updated", "task", task.id, task.title, updates.pinned ? "Angepinnt" : "Losgelöst");
  } else {
    await logActivity("updated", "task", task.id, task.title);
  }
  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  await db.delete(tasks).where(eq(tasks.id, id));
  if (task) await logActivity("deleted", "task", id, task.title);
  return NextResponse.json({ ok: true });
}
