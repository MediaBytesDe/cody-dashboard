import { db } from "@/db";
import { comments, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [comment] = await db.insert(comments).values({
    taskId: body.taskId,
    content: body.content,
    author: body.author || "Cody",
  }).returning();

  const [task] = await db.select().from(tasks).where(eq(tasks.id, body.taskId));
  if (task) await logActivity("comment_added", "task", task.id, task.title, body.content.substring(0, 100));

  return NextResponse.json(comment, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await db.delete(comments).where(eq(comments.id, id));
  return NextResponse.json({ ok: true });
}
