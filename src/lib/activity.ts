import { db } from "@/db";
import { activityLog } from "@/db/schema";

export async function logActivity(action: string, entityType: string, entityId: string, entityTitle?: string, details?: string) {
  await db.insert(activityLog).values({ action, entityType, entityId, entityTitle: entityTitle || null, details: details || null });
}
