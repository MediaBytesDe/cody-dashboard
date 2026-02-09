"use client";

import { useState } from "react";
import { Task, Project } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  CalendarDays,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

const statusConfig = {
  open: { label: "Offen", icon: Circle, color: "text-gray-400", bg: "bg-gray-100" },
  in_progress: { label: "In Bearbeitung", icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
  done: { label: "Erledigt", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
};

const priorityConfig = {
  high: { label: "Hoch", icon: ArrowUp, color: "text-red-500" },
  medium: { label: "Mittel", icon: ArrowRight, color: "text-yellow-500" },
  low: { label: "Niedrig", icon: ArrowDown, color: "text-gray-400" },
};

interface Props {
  tasks: Task[];
  projects: Project[];
  stats: { total: number; open: number; inProgress: number; done: number };
}

export function Dashboard({ tasks: initialTasks, projects: initialProjects, stats }: Props) {
  const router = useRouter();
  const [showNewTask, setShowNewTask] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", projectId: "", dueDate: "" });
  const [newProject, setNewProject] = useState({ name: "", description: "" });

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    });
    setNewTask({ title: "", description: "", priority: "medium", projectId: "", dueDate: "" });
    setShowNewTask(false);
    router.refresh();
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProject),
    });
    setNewProject({ name: "", description: "" });
    setShowNewProject(false);
    router.refresh();
  }

  async function updateTaskStatus(id: string, status: string) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  async function deleteTask(id: string) {
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  async function deleteProject(id: string) {
    await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  const statCards = [
    { label: "Gesamt", value: stats.total, icon: ListTodo, color: "text-foreground" },
    { label: "Offen", value: stats.open, icon: Circle, color: "text-gray-500" },
    { label: "In Bearbeitung", value: stats.inProgress, icon: Clock, color: "text-blue-500" },
    { label: "Erledigt", value: stats.done, icon: CheckCircle2, color: "text-green-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">Cody Dashboard</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
              <p className="mt-2 text-3xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Projects */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FolderKanban className="h-5 w-5" /> Projekte
            </h2>
            <button onClick={() => setShowNewProject(true)} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> Neu
            </button>
          </div>

          {showNewProject && (
            <form onSubmit={createProject} className="rounded-lg border bg-white p-4 mb-4 shadow-sm space-y-3">
              <input placeholder="Projektname" required value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm" />
              <input placeholder="Beschreibung (optional)" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <button type="submit" className="rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground">Erstellen</button>
                <button type="button" onClick={() => setShowNewProject(false)} className="rounded-md border px-4 py-1.5 text-sm">Abbrechen</button>
              </div>
            </form>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            {initialProjects.map((p) => {
              const projectTasks = initialTasks.filter((t) => t.projectId === p.id);
              const doneCount = projectTasks.filter((t) => t.status === "done").length;
              return (
                <div key={p.id} className="rounded-lg border bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{p.name}</h3>
                      {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                    </div>
                    <button onClick={() => deleteProject(p.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <ListTodo className="h-4 w-4" />
                    {doneCount}/{projectTasks.length} erledigt
                  </div>
                  {projectTasks.length > 0 && (
                    <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(doneCount / projectTasks.length) * 100}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Tasks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ListTodo className="h-5 w-5" /> Aufgaben
            </h2>
            <button onClick={() => setShowNewTask(true)} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> Neue Aufgabe
            </button>
          </div>

          {showNewTask && (
            <form onSubmit={createTask} className="rounded-lg border bg-white p-4 mb-4 shadow-sm space-y-3">
              <input placeholder="Aufgabentitel" required value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm" />
              <input placeholder="Beschreibung (optional)" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} className="w-full rounded-md border px-3 py-2 text-sm" />
              <div className="grid grid-cols-3 gap-3">
                <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
                  <option value="high">Hoch</option>
                  <option value="medium">Mittel</option>
                  <option value="low">Niedrig</option>
                </select>
                <select value={newTask.projectId} onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
                  <option value="">Kein Projekt</option>
                  {initialProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground">Erstellen</button>
                <button type="button" onClick={() => setShowNewTask(false)} className="rounded-md border px-4 py-1.5 text-sm">Abbrechen</button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {initialTasks.map((task) => {
              const sc = statusConfig[task.status];
              const pc = priorityConfig[task.priority];
              const project = initialProjects.find((p) => p.id === task.projectId);
              const StatusIcon = sc.icon;
              const PriorityIcon = pc.icon;
              return (
                <div key={task.id} className={cn("rounded-lg border bg-white p-4 shadow-sm flex items-center gap-4", task.status === "done" && "opacity-60")}>
                  <button
                    onClick={() => {
                      const next = task.status === "open" ? "in_progress" : task.status === "in_progress" ? "done" : "open";
                      updateTaskStatus(task.id, next);
                    }}
                    className={cn("shrink-0", sc.color)}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium", task.status === "done" && "line-through")}>{task.title}</span>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", sc.bg, sc.color)}>
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <PriorityIcon className={cn("h-3 w-3", pc.color)} /> {pc.label}
                      </span>
                      {project && (
                        <span className="inline-flex items-center gap-1">
                          <FolderKanban className="h-3 w-3" /> {project.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {format(new Date(task.dueDate), "dd.MM.yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            {initialTasks.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Keine Aufgaben vorhanden. Erstelle eine neue!</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
