import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const all = await db.query.projects.findMany({
    orderBy: (p, { desc }) => [desc(p.createdAt)],
  });
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [project] = await db.insert(projects).values({
    name: body.name,
    description: body.description || null,
  }).returning();
  await logActivity("created", "project", project.id, project.name);
  return NextResponse.json(project, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  await db.delete(projects).where(eq(projects.id, id));
  if (project) await logActivity("deleted", "project", id, project.name);
  return NextResponse.json({ ok: true });
}
