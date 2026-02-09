import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderKanban, ArrowUp, ArrowRight, ArrowDown, CalendarDays } from "lucide-react";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = { open: "Offen", in_progress: "In Bearbeitung", done: "Erledigt" };
const statusColors: Record<string, string> = { open: "bg-gray-500", in_progress: "bg-blue-500", done: "bg-green-500" };
const priorityIcons: Record<string, typeof ArrowUp> = { high: ArrowUp, medium: ArrowRight, low: ArrowDown };
const priorityColors: Record<string, string> = { high: "text-red-500", medium: "text-yellow-500", low: "text-gray-400" };

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
  if (!project) notFound();

  const projectTasks = await db.query.tasks.findMany({
    where: eq(tasks.projectId, id),
    with: { taskTags: { with: { tag: true } } },
    orderBy: [desc(tasks.createdAt)],
  });

  const doneCount = projectTasks.filter((t) => t.status === "done").length;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/projects"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderKanban className="h-5 w-5" /> {project.name}
          </h1>
          {project.description && <p className="text-muted-foreground">{project.description}</p>}
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{doneCount}/{projectTasks.length} Aufgaben erledigt</span>
            <span className="text-sm text-muted-foreground">
              {projectTasks.length > 0 ? Math.round((doneCount / projectTasks.length) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${projectTasks.length > 0 ? (doneCount / projectTasks.length) * 100 : 0}%` }} />
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Aufgaben ({projectTasks.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {projectTasks.map((task) => {
            const PIcon = priorityIcons[task.priority];
            const isOverdue = task.dueDate && task.status !== "done" && isPast(new Date(task.dueDate));
            return (
              <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center gap-3 p-3 rounded-md hover:bg-accent transition-colors">
                <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", statusColors[task.status])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium", task.status === "done" && "line-through opacity-60")}>{task.title}</span>
                    {task.taskTags?.map((tt) => (
                      <span key={tt.tag.id} className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: tt.tag.color + "20", color: tt.tag.color }}>
                        {tt.tag.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PIcon className={cn("h-3 w-3", priorityColors[task.priority])} />
                  <Badge variant="outline" className="text-xs">{statusLabels[task.status]}</Badge>
                  {task.dueDate && (
                    <span className={cn("text-xs", isOverdue ? "text-destructive" : "text-muted-foreground")}>
                      <CalendarDays className="h-3 w-3 inline mr-0.5" />
                      {format(new Date(task.dueDate), "dd.MM.")}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
          {projectTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Keine Aufgaben in diesem Projekt</p>}
        </CardContent>
      </Card>
    </div>
  );
}
