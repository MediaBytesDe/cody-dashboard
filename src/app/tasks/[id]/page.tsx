import { db } from "@/db";
import { tasks, projects, tags, comments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { TaskDetail } from "@/components/task-detail";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: {
      project: true,
      taskTags: { with: { tag: true } },
      comments: { orderBy: [desc(comments.createdAt)] },
    },
  });

  if (!task) notFound();

  const [allProjects, allTags] = await Promise.all([
    db.select().from(projects),
    db.select().from(tags),
  ]);

  return (
    <div className="p-6 max-w-4xl">
      <TaskDetail task={task} projects={allProjects} allTags={allTags} />
    </div>
  );
}
