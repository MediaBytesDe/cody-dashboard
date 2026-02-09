"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Task, Project, Tag } from "@/db/schema";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  CheckCircle2, Circle, Clock, Plus, Trash2, Search,
  ArrowUp, ArrowRight, ArrowDown, CalendarDays, FolderKanban, Pin, Repeat,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { toast } from "sonner";

const statusConfig = {
  open: { label: "Offen", icon: Circle, color: "text-gray-400" },
  in_progress: { label: "In Bearbeitung", icon: Clock, color: "text-blue-500" },
  done: { label: "Erledigt", icon: CheckCircle2, color: "text-green-500" },
};
const priorityConfig = {
  high: { label: "Hoch", icon: ArrowUp, color: "text-red-500" },
  medium: { label: "Mittel", icon: ArrowRight, color: "text-yellow-500" },
  low: { label: "Niedrig", icon: ArrowDown, color: "text-gray-400" },
};

type TaskWithTags = Task & { taskTags: { tag: Tag }[] };

interface Props {
  tasks: TaskWithTags[];
  projects: Project[];
  tags: Tag[];
}

export function TaskList({ tasks, projects, tags }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [showNew, setShowNew] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", projectId: "", dueDate: "", startDate: "", recurringPattern: "" });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (projectFilter !== "all" && t.projectId !== projectFilter) return false;
    return true;
  });

  const byStatus = (status: string) => filtered.filter((t) => t.status === status);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(t => t.id)));
    }
  }

  async function bulkAction(action: string, value?: string) {
    await fetch("/api/tasks/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), action, value }),
    });
    setSelected(new Set());
    toast.success(action === "delete" ? "Tasks gelöscht" : "Status geändert");
    router.refresh();
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    });
    setNewTask({ title: "", description: "", priority: "medium", projectId: "", dueDate: "", startDate: "", recurringPattern: "" });
    setShowNew(false);
    toast.success("Aufgabe erstellt");
    router.refresh();
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    toast.success("Status geändert");
    router.refresh();
  }

  async function deleteTask(id: string) {
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    toast.success("Aufgabe gelöscht");
    router.refresh();
  }

  function TaskRow({ task }: { task: TaskWithTags }) {
    const sc = statusConfig[task.status];
    const pc = priorityConfig[task.priority];
    const StatusIcon = sc.icon;
    const PriorityIcon = pc.icon;
    const project = projects.find((p) => p.id === task.projectId);
    const isOverdue = task.dueDate && task.status !== "done" && isPast(new Date(task.dueDate));

    return (
      <div className={cn("rounded-lg border bg-card p-4 flex items-center gap-4 hover:bg-accent/30 transition-colors", task.status === "done" && "opacity-60")}>
        <input
          type="checkbox"
          checked={selected.has(task.id)}
          onChange={() => toggleSelect(task.id)}
          className="shrink-0 h-4 w-4 rounded border-muted-foreground"
        />
        <button
          onClick={() => {
            const next = task.status === "open" ? "in_progress" : task.status === "in_progress" ? "done" : "open";
            updateStatus(task.id, next);
          }}
          className={cn("shrink-0", sc.color)}
        >
          <StatusIcon className="h-5 w-5" />
        </button>
        <Link href={`/tasks/${task.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {task.pinned && <Pin className="h-3 w-3 text-yellow-500" />}
            {task.recurringPattern && <Repeat className="h-3 w-3 text-muted-foreground" />}
            <span className={cn("font-medium", task.status === "done" && "line-through")}>{task.title}</span>
            {task.taskTags?.map((tt) => (
              <span key={tt.tag.id} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: tt.tag.color + "20", color: tt.tag.color }}>
                {tt.tag.name}
              </span>
            ))}
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
              <span className={cn("inline-flex items-center gap-1", isOverdue && "text-destructive font-medium")}>
                <CalendarDays className="h-3 w-3" /> {format(new Date(task.dueDate), "dd.MM.yyyy")}
                {isOverdue && " ⚠️"}
              </span>
            )}
          </div>
        </Link>
        <button onClick={() => deleteTask(task.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Suchen..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priorität" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="high">Hoch</SelectItem>
            <SelectItem value="medium">Mittel</SelectItem>
            <SelectItem value="low">Niedrig</SelectItem>
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Projekt" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Projekte</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4 mr-1" /> Neue Aufgabe
        </Button>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
          <span className="text-sm font-medium">{selected.size} ausgewählt</span>
          <Button size="sm" variant="outline" onClick={() => bulkAction("status_change", "done")}>✅ Erledigt</Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("status_change", "in_progress")}>🔄 In Bearbeitung</Button>
          <Button size="sm" variant="outline" onClick={() => bulkAction("status_change", "open")}>⬜ Offen</Button>
          <Button size="sm" variant="destructive" onClick={() => bulkAction("delete")}>🗑️ Löschen</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Abbrechen</Button>
        </div>
      )}

      {/* Select All */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="h-4 w-4" />
        <span>Alle auswählen</span>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Alle ({filtered.length})</TabsTrigger>
          <TabsTrigger value="open">Offen ({byStatus("open").length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Bearbeitung ({byStatus("in_progress").length})</TabsTrigger>
          <TabsTrigger value="done">Erledigt ({byStatus("done").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-2">
          {filtered.map((t) => <TaskRow key={t.id} task={t} />)}
        </TabsContent>
        <TabsContent value="open" className="space-y-2">
          {byStatus("open").map((t) => <TaskRow key={t.id} task={t} />)}
        </TabsContent>
        <TabsContent value="in_progress" className="space-y-2">
          {byStatus("in_progress").map((t) => <TaskRow key={t.id} task={t} />)}
        </TabsContent>
        <TabsContent value="done" className="space-y-2">
          {byStatus("done").map((t) => <TaskRow key={t.id} task={t} />)}
        </TabsContent>
      </Tabs>

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">Keine Aufgaben gefunden</p>}

      {/* New Task Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Aufgabe</DialogTitle>
          </DialogHeader>
          <form onSubmit={createTask} className="space-y-4">
            <Input placeholder="Titel" required value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
            <Input placeholder="Beschreibung (optional)" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="low">Niedrig</SelectItem>
                </SelectContent>
              </Select>
              <Select value={newTask.projectId || "none"} onValueChange={(v) => setNewTask({ ...newTask, projectId: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Projekt" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Projekt</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Startdatum</label>
                <Input type="date" value={newTask.startDate} onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fälligkeitsdatum</label>
                <Input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
              </div>
            </div>
            <Select value={newTask.recurringPattern || "none"} onValueChange={(v) => setNewTask({ ...newTask, recurringPattern: v === "none" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Wiederkehrend" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nicht wiederkehrend</SelectItem>
                <SelectItem value="daily">Täglich</SelectItem>
                <SelectItem value="weekly">Wöchentlich</SelectItem>
                <SelectItem value="monthly">Monatlich</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Abbrechen</Button>
              <Button type="submit">Erstellen</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
