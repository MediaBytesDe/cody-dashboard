import { db } from "@/db";
import { tasks, projects } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { TimelineView } from "@/components/timeline-view";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const [allTasks, allProjects] = await Promise.all([
    db.select().from(tasks).where(
      sql`${tasks.dueDate} IS NOT NULL`
    ).orderBy(desc(tasks.createdAt)),
    db.select().from(projects).orderBy(desc(projects.createdAt)),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Timeline</h1>
        <p className="text-muted-foreground">Zeitstrahl deiner Aufgaben</p>
      </div>
      <TimelineView tasks={allTasks} projects={allProjects} />
    </div>
  );
}
