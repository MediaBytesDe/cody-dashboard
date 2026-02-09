import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const allTasks = await db.query.tasks.findMany({
    with: { },
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
  }).returning();
  return NextResponse.json(task, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);
  const [task] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await db.delete(tasks).where(eq(tasks.id, id));
  return NextResponse.json({ ok: true });
}
