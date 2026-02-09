import { db } from "@/db";
import { activityLog } from "@/db/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const entries = await db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(50);
  return NextResponse.json(entries);
}
