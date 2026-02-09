import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import { ProjectList } from "@/components/project-list";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));

  // Get task counts per project
  const taskCounts = await db
    .select({
      projectId: tasks.projectId,
      total: sql<number>`count(*)::int`,
      done: sql<number>`count(*) filter (where ${tasks.status} = 'done')::int`,
    })
    .from(tasks)
    .where(sql`${tasks.projectId} is not null`)
    .groupBy(tasks.projectId);

  const projectsWithCounts = allProjects.map((p) => {
    const counts = taskCounts.find((c) => c.projectId === p.id);
    return { ...p, taskCount: counts?.total || 0, doneCount: counts?.done || 0 };
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Projekte</h1>
        <p className="text-muted-foreground">Verwalte deine Projekte</p>
      </div>
      <ProjectList projects={projectsWithCounts} />
    </div>
  );
}
