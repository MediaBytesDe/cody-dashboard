import { db } from "@/db";
import { notes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const [note] = await db.update(notes).set({
    title: body.title,
    content: body.content,
    projectId: body.projectId || null,
    taskId: body.taskId || null,
    updatedAt: new Date(),
  }).where(eq(notes.id, id)).returning();
  await logActivity("updated", "note", note.id, note.title);
  return NextResponse.json(note);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [note] = await db.select().from(notes).where(eq(notes.id, id));
  await db.delete(notes).where(eq(notes.id, id));
  if (note) await logActivity("deleted", "note", id, note.title);
  return NextResponse.json({ ok: true });
}
