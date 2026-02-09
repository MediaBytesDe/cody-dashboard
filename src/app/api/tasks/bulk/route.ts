import { db } from "@/db";
import { tasks } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { ids, action, value } = body as { ids: string[]; action: string; value?: string };

  if (!ids?.length) return NextResponse.json({ error: "No ids" }, { status: 400 });

  if (action === "status_change" && value) {
    await db.update(tasks).set({ status: value as "open" | "in_progress" | "done" }).where(inArray(tasks.id, ids));
    for (const id of ids) {
      await logActivity("status_changed", "task", id, undefined, `→ ${value}`);
    }
  } else if (action === "delete") {
    await db.delete(tasks).where(inArray(tasks.id, ids));
    for (const id of ids) {
      await logActivity("deleted", "task", id);
    }
  }

  return NextResponse.json({ ok: true });
}
