import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sortBy = searchParams.get("sort") || "createdAt";
  const order = searchParams.get("order") || "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = (page - 1) * limit;

  const all = await db.query.projects.findMany({
    orderBy: (p, { desc: d, asc: a }) => {
      const dir = order === "asc" ? a : d;
      return [dir(sortBy === "name" ? p.name : p.createdAt)];
    },
    limit,
    offset,
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
