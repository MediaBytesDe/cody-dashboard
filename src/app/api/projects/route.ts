import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

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
  return NextResponse.json(project, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await db.delete(projects).where(eq(projects.id, id));
  return NextResponse.json({ ok: true });
}
