import { db } from "@/db";
import { tasks } from "@/db/schema";
import { desc } from "drizzle-orm";
import { KanbanBoard } from "@/components/kanban-board";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const allTasks = await db.query.tasks.findMany({
    with: { taskTags: { with: { tag: true } } },
    orderBy: [desc(tasks.createdAt)],
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <p className="text-muted-foreground">Drag & Drop zum Verschieben</p>
      </div>
      <KanbanBoard tasks={allTasks} />
    </div>
  );
}
