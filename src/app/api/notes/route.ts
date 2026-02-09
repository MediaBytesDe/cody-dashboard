import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const taskId = searchParams.get("taskId");

  let result;
  if (projectId) {
    result = await db.query.notes.findMany({
      where: eq(notes.projectId, projectId),
      with: { project: true, task: true },
      orderBy: [desc(notes.updatedAt)],
    });
  } else if (taskId) {
    result = await db.query.notes.findMany({
      where: eq(notes.taskId, taskId),
      with: { project: true, task: true },
      orderBy: [desc(notes.updatedAt)],
    });
  } else {
    result = await db.query.notes.findMany({
      with: { project: true, task: true },
      orderBy: [desc(notes.updatedAt)],
    });
  }
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [note] = await db.insert(notes).values({
    title: body.title,
    content: body.content || "",
    projectId: body.projectId || null,
    taskId: body.taskId || null,
  }).returning();
  await logActivity("created", "note", note.id, note.title);
  return NextResponse.json(note, { status: 201 });
}
