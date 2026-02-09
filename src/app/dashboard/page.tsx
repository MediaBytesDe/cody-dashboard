import { db } from "@/db";
import { tasks, projects, activityLog } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import { DashboardClient } from "@/components/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [allTasks, allProjects, stats, overdueTasks, recentActivity, pinnedTasks, weeklyStats] = await Promise.all([
    db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(5),
    db.select().from(projects).orderBy(desc(projects.createdAt)),
    db
      .select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) filter (where ${tasks.status} = 'open')::int`,
        inProgress: sql<number>`count(*) filter (where ${tasks.status} = 'in_progress')::int`,
        done: sql<number>`count(*) filter (where ${tasks.status} = 'done')::int`,
      })
      .from(tasks)
      .then((r) => r[0]),
    db.select().from(tasks).where(
      sql`${tasks.dueDate} < now() AND ${tasks.status} != 'done'`
    ),
    db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(10),
    db.select().from(tasks).where(eq(tasks.pinned, true)).orderBy(desc(tasks.createdAt)),
    // Tasks done per week (last 8 weeks)
    db.execute(sql`
      SELECT
        date_trunc('week', ${tasks.createdAt})::text as week,
        count(*) filter (where ${tasks.status} = 'done')::int as done,
        count(*) filter (where ${tasks.status} = 'open')::int as open,
        count(*) filter (where ${tasks.status} = 'in_progress')::int as in_progress
      FROM ${tasks}
      WHERE ${tasks.createdAt} > now() - interval '8 weeks'
      GROUP BY 1
      ORDER BY 1
    `).then(r => r as any[]),
  ]);

  return (
    <DashboardClient
      tasks={allTasks}
      projects={allProjects}
      stats={stats}
      overdueTasks={overdueTasks}
      recentActivity={recentActivity}
      pinnedTasks={pinnedTasks}
      weeklyStats={weeklyStats as any[]}
    />
  );
}
