"use client";

import { Task, Project } from "@/db/schema";
import { cn } from "@/lib/utils";
import { format, differenceInDays, addDays, startOfWeek, endOfWeek, eachWeekOfInterval, min, max } from "date-fns";
import { de } from "date-fns/locale";
import { useMemo, useRef } from "react";

const statusColors: Record<string, string> = {
  open: "bg-blue-500",
  in_progress: "bg-yellow-500",
  done: "bg-green-500",
};

const statusLabels: Record<string, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  done: "Erledigt",
};

interface Props {
  tasks: Task[];
  projects: Project[];
}

export function TimelineView({ tasks, projects }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { weeks, timelineStart, grouped } = useMemo(() => {
    const tasksWithDates = tasks.filter(t => t.dueDate);
    if (tasksWithDates.length === 0) return { weeks: [], timelineStart: new Date(), grouped: [] };

    const allDates = tasksWithDates.flatMap(t => [
      t.startDate ? new Date(t.startDate) : new Date(t.createdAt),
      new Date(t.dueDate!),
    ]);

    const minDate = startOfWeek(min(allDates), { locale: de });
    const maxDate = endOfWeek(max(allDates), { locale: de });
    const weeks = eachWeekOfInterval({ start: minDate, end: maxDate }, { locale: de });

    // Group tasks by project
    const projectMap = new Map<string, { project: Project | null; tasks: Task[] }>();
    projectMap.set("none", { project: null, tasks: [] });
    projects.forEach(p => projectMap.set(p.id, { project: p, tasks: [] }));

    tasksWithDates.forEach(t => {
      const key = t.projectId || "none";
      if (!projectMap.has(key)) projectMap.set(key, { project: null, tasks: [] });
      projectMap.get(key)!.tasks.push(t);
    });

    const grouped = Array.from(projectMap.values()).filter(g => g.tasks.length > 0);

    return { weeks, timelineStart: minDate, grouped };
  }, [tasks, projects]);

  if (tasks.filter(t => t.dueDate).length === 0) {
    return <p className="text-center text-muted-foreground py-12">Keine Tasks mit Fälligkeitsdatum vorhanden. Füge Daten hinzu, um die Timeline zu sehen.</p>;
  }

  const dayWidth = 40;
  const totalDays = weeks.length * 7;
  const totalWidth = totalDays * dayWidth;

  function getBarStyle(task: Task) {
    const start = task.startDate ? new Date(task.startDate) : new Date(task.createdAt);
    const end = new Date(task.dueDate!);
    const startOffset = Math.max(0, differenceInDays(start, timelineStart));
    const duration = Math.max(1, differenceInDays(end, start) + 1);
    return {
      left: startOffset * dayWidth,
      width: duration * dayWidth - 4,
    };
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex gap-4 text-sm">
        {Object.entries(statusColors).map(([key, color]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={cn("h-3 w-3 rounded", color)} />
            <span>{statusLabels[key]}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div ref={scrollRef} className="overflow-x-auto border rounded-lg bg-card">
        <div style={{ minWidth: totalWidth + 200 }}>
          {/* Week Headers */}
          <div className="flex border-b sticky top-0 bg-card z-10">
            <div className="w-48 shrink-0 p-2 border-r font-medium text-sm">Projekt / Task</div>
            <div className="flex">
              {weeks.map((week, i) => (
                <div key={i} className="border-r text-center text-xs text-muted-foreground py-2" style={{ width: dayWidth * 7 }}>
                  {format(week, "dd. MMM", { locale: de })}
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {grouped.map((group, gi) => (
            <div key={gi}>
              {/* Project Header */}
              <div className="flex border-b bg-muted/30">
                <div className="w-48 shrink-0 p-2 border-r font-medium text-sm truncate">
                  {group.project?.name || "Ohne Projekt"}
                </div>
                <div style={{ width: totalWidth }} />
              </div>

              {/* Task Bars */}
              {group.tasks.map(task => {
                const bar = getBarStyle(task);
                return (
                  <div key={task.id} className="flex border-b hover:bg-accent/30">
                    <div className="w-48 shrink-0 p-2 border-r text-sm truncate pl-6">
                      {task.title}
                    </div>
                    <div className="relative" style={{ width: totalWidth, height: 36 }}>
                      <div
                        className={cn("absolute top-1.5 h-5 rounded text-xs text-white flex items-center px-2 truncate", statusColors[task.status])}
                        style={{ left: bar.left, width: bar.width }}
                        title={`${task.title}: ${task.startDate ? format(new Date(task.startDate), "dd.MM.") : ""} – ${format(new Date(task.dueDate!), "dd.MM.yyyy")}`}
                      >
                        {bar.width > 80 ? task.title : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
