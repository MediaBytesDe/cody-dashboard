import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq, isNotNull, desc, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { addDays, addWeeks, addMonths, isPast } from "date-fns";

export async function GET() {
  const recurring = await db.select().from(tasks).where(
    isNotNull(tasks.recurringPattern)
  ).orderBy(desc(tasks.createdAt));
  return NextResponse.json(recurring);
}

export async function POST() {
  // Find all recurring source tasks
  const sources = await db.select().from(tasks).where(
    isNotNull(tasks.recurringPattern)
  );

  const created: string[] = [];

  for (const source of sources) {
    if (!source.recurringPattern) continue;

    // Find latest created child (or the source itself if no children)
    const children = await db.select().from(tasks).where(
      eq(tasks.recurringSourceId, source.id)
    ).orderBy(desc(tasks.createdAt)).limit(1);

    const latest = children[0] || source;

    // Check if latest is done or interval passed
    if (latest.status !== "done") continue;

    // Calculate next due date
    const baseDue = latest.dueDate ? new Date(latest.dueDate) : new Date(latest.createdAt);
    let nextDue: Date;
    switch (source.recurringPattern) {
      case "daily": nextDue = addDays(baseDue, 1); break;
      case "weekly": nextDue = addWeeks(baseDue, 1); break;
      case "monthly": nextDue = addMonths(baseDue, 1); break;
      default: continue;
    }

    // Create new task
    const [newTask] = await db.insert(tasks).values({
      title: source.title,
      description: source.description,
      priority: source.priority,
      projectId: source.projectId,
      dueDate: nextDue,
      startDate: source.startDate ? addDays(nextDue, -1) : null,
      recurringSourceId: source.id,
      recurringPattern: null, // Children don't recurr themselves
    }).returning();

    await logActivity("created", "task", newTask.id, newTask.title, `Recurring from ${source.title}`);
    created.push(newTask.id);
  }

  return NextResponse.json({ created: created.length, ids: created });
}
