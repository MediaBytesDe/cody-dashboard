import { db } from "@/db";
import { tasks, projects } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [allTasks, allProjects, stats] = await Promise.all([
    db.select().from(tasks).orderBy(desc(tasks.createdAt)),
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
  ]);

  return (
    <Dashboard
      tasks={allTasks}
      projects={allProjects}
      stats={stats}
    />
  );
}
