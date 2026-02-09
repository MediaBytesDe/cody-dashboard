"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Task, Tag } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { ArrowUp, ArrowRight, ArrowDown, CalendarDays } from "lucide-react";
import { format, isPast } from "date-fns";

type TaskWithTags = Task & { taskTags: { tag: Tag }[] };

const columns = [
  { id: "open", title: "Offen", color: "border-t-gray-500" },
  { id: "in_progress", title: "In Bearbeitung", color: "border-t-blue-500" },
  { id: "done", title: "Erledigt", color: "border-t-green-500" },
] as const;

const priorityIcons = { high: ArrowUp, medium: ArrowRight, low: ArrowDown };
const priorityColors = { high: "text-red-500", medium: "text-yellow-500", low: "text-gray-400" };

export function KanbanBoard({ tasks }: { tasks: TaskWithTags[] }) {
  const router = useRouter();
  const [items, setItems] = useState(tasks);

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;

    setItems((prev) => prev.map((t) => t.id === draggableId ? { ...t, status: newStatus as Task["status"] } : t));

    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: draggableId, status: newStatus }),
    });
    router.refresh();
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[60vh]">
        {columns.map((col) => {
          const colTasks = items.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className={cn("rounded-lg border border-t-4 bg-muted/30 p-3", col.color)}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{col.title}</h3>
                <Badge variant="secondary" className="text-xs">{colTasks.length}</Badge>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn("space-y-2 min-h-[100px] rounded-md p-1 transition-colors", snapshot.isDraggingOver && "bg-accent/50")}
                  >
                    {colTasks.map((task, index) => {
                      const PIcon = priorityIcons[task.priority];
                      const isOverdue = task.dueDate && task.status !== "done" && isPast(new Date(task.dueDate));
                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn("rounded-md border bg-card p-3 shadow-sm transition-shadow", snapshot.isDragging && "shadow-lg ring-2 ring-ring")}
                            >
                              <Link href={`/tasks/${task.id}`} className="block">
                                <p className="font-medium text-sm mb-2">{task.title}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <PIcon className={cn("h-3 w-3", priorityColors[task.priority])} />
                                  {task.taskTags?.map((tt) => (
                                    <span key={tt.tag.id} className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: tt.tag.color + "20", color: tt.tag.color }}>
                                      {tt.tag.name}
                                    </span>
                                  ))}
                                  {task.dueDate && (
                                    <span className={cn("text-[10px] flex items-center gap-0.5", isOverdue ? "text-destructive" : "text-muted-foreground")}>
                                      <CalendarDays className="h-2.5 w-2.5" />
                                      {format(new Date(task.dueDate), "dd.MM.")}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
