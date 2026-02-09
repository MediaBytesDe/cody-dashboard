import { db } from "@/db";
import { tags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const all = await db.select().from(tags);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const [tag] = await db.insert(tags).values({
    name: body.name,
    color: body.color || "#6366f1",
  }).returning();
  await logActivity("created", "tag", tag.id, tag.name);
  return NextResponse.json(tag, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const [tag] = await db.select().from(tags).where(eq(tags.id, id));
  await db.delete(tags).where(eq(tags.id, id));
  if (tag) await logActivity("deleted", "tag", id, tag.name);
  return NextResponse.json({ ok: true });
}
