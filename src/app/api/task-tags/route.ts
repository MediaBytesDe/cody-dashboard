import { db } from "@/db";
import { taskTags, tasks, tags } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [tt] = await db.insert(taskTags).values({
    taskId: body.taskId,
    tagId: body.tagId,
  }).returning();

  const [task] = await db.select().from(tasks).where(eq(tasks.id, body.taskId));
  const [tag] = await db.select().from(tags).where(eq(tags.id, body.tagId));
  if (task && tag) await logActivity("tag_added", "task", task.id, task.title, tag.name);

  return NextResponse.json(tt, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  await db.delete(taskTags).where(
    and(eq(taskTags.taskId, body.taskId), eq(taskTags.tagId, body.tagId))
  );

  const [task] = await db.select().from(tasks).where(eq(tasks.id, body.taskId));
  const [tag] = await db.select().from(tags).where(eq(tags.id, body.tagId));
  if (task && tag) await logActivity("tag_removed", "task", task.id, task.title, tag.name);

  return NextResponse.json({ ok: true });
}
