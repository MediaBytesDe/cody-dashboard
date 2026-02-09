import { db } from "@/db";
import { tasks, projects, tags, taskTags } from "@/db/schema";
import { desc } from "drizzle-orm";
import { TaskList } from "@/components/task-list";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [allTasks, allProjects, allTags] = await Promise.all([
    db.query.tasks.findMany({
      with: { taskTags: { with: { tag: true } } },
      orderBy: [desc(tasks.createdAt)],
    }),
    db.select().from(projects).orderBy(desc(projects.createdAt)),
    db.select().from(tags),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aufgaben</h1>
        <p className="text-muted-foreground">Verwalte alle deine Aufgaben</p>
      </div>
      <TaskList tasks={allTasks} projects={allProjects} tags={allTags} />
    </div>
  );
}
