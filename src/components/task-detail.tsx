"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Task, Project, Tag, Comment } from "@/db/schema";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import {
  ArrowLeft, Save, Trash2, MessageSquare, Tag as TagIcon,
  CalendarDays, Send, X, Plus, Pin, PinOff, Repeat,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { toast } from "sonner";

type TaskWithRelations = Task & {
  project: Project | null;
  taskTags: { tag: Tag }[];
  comments: Comment[];
};

interface Props {
  task: TaskWithRelations;
  projects: Project[];
  allTags: Tag[];
}

export function TaskDetail({ task, projects, allTags }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    status: task.status,
    priority: task.priority,
    projectId: task.projectId || "",
    dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
    startDate: task.startDate ? format(new Date(task.startDate), "yyyy-MM-dd") : "",
    recurringPattern: task.recurringPattern || "",
  });
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isOverdue = task.dueDate && task.status !== "done" && isPast(new Date(task.dueDate));
  const assignedTagIds = task.taskTags.map((tt) => tt.tag.id);

  async function saveTask() {
    setSubmitting(true);
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: task.id,
        ...form,
        projectId: form.projectId || null,
        dueDate: form.dueDate || null,
        startDate: form.startDate || null,
        recurringPattern: form.recurringPattern || null,
      }),
    });
    setEditing(false);
    setSubmitting(false);
    toast.success("Aufgabe gespeichert");
    router.refresh();
  }

  async function togglePin() {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, pinned: !task.pinned }),
    });
    toast.success(task.pinned ? "Task losgelöst" : "Task angepinnt");
    router.refresh();
  }

  async function deleteTask() {
    if (!confirm("Aufgabe wirklich löschen?")) return;
    await fetch("/api/tasks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id }),
    });
    toast.success("Aufgabe gelöscht");
    router.push("/tasks");
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, content: newComment }),
    });
    setNewComment("");
    toast.success("Kommentar hinzugefügt");
    router.refresh();
  }

  async function toggleTag(tagId: string) {
    const hasTag = assignedTagIds.includes(tagId);
    await fetch("/api/task-tags", {
      method: hasTag ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, tagId }),
    });
    toast.success(hasTag ? "Tag entfernt" : "Tag hinzugefügt");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/tasks">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          {editing ? (
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="text-xl font-bold" />
          ) : (
            <div className="flex items-center gap-2">
              {task.pinned && <Pin className="h-4 w-4 text-yellow-500" />}
              {task.recurringPattern && <Badge variant="secondary" className="text-xs"><Repeat className="h-3 w-3 mr-1" />{task.recurringPattern}</Badge>}
              <h1 className="text-2xl font-bold">{task.title}</h1>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={togglePin} title={task.pinned ? "Loslösen" : "Anpinnen"}>
            {task.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>
          {editing ? (
            <>
              <Button onClick={saveTask} disabled={submitting}><Save className="h-4 w-4 mr-1" /> Speichern</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Abbrechen</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(true)}>Bearbeiten</Button>
              <Button variant="destructive" size="icon" onClick={deleteTask}><Trash2 className="h-4 w-4" /></Button>
            </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Beschreibung</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Beschreibung hinzufügen..." />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description || "Keine Beschreibung"}</p>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Kommentare ({task.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={addComment} className="flex gap-2">
                <Input placeholder="Kommentar schreiben..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="flex-1" />
                <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
              </form>
              {task.comments.map((c) => (
                <div key={c.id} className="rounded-md bg-muted p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{c.author}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(c.createdAt), "dd.MM.yyyy HH:mm")}</span>
                  </div>
                  <p className="text-sm">{c.content}</p>
                </div>
              ))}
              {task.comments.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Kommentare</p>}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                {editing ? (
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Offen</SelectItem>
                      <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                      <SelectItem value="done">Erledigt</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1"><Badge variant="secondary" className="capitalize">{task.status.replace("_", " ")}</Badge></div>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Priorität</label>
                {editing ? (
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as typeof form.priority })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="low">Niedrig</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm mt-1 capitalize">{task.priority}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Projekt</label>
                {editing ? (
                  <Select value={form.projectId || "none"} onValueChange={(v) => setForm({ ...form, projectId: v === "none" ? "" : v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Kein Projekt</SelectItem>
                      {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm mt-1">{task.project?.name || "—"}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Startdatum</label>
                {editing ? (
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1" />
                ) : (
                  <p className="text-sm mt-1">{task.startDate ? format(new Date(task.startDate), "dd.MM.yyyy") : "—"}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="h-3 w-3" /> Fällig</label>
                {editing ? (
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="mt-1" />
                ) : (
                  <p className={cn("text-sm mt-1", isOverdue && "text-destructive font-medium")}>
                    {task.dueDate ? format(new Date(task.dueDate), "dd.MM.yyyy") : "—"}
                    {isOverdue && " (Überfällig!)"}
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1"><Repeat className="h-3 w-3" /> Wiederkehrend</label>
                {editing ? (
                  <Select value={form.recurringPattern || "none"} onValueChange={(v) => setForm({ ...form, recurringPattern: v === "none" ? "" : v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nicht wiederkehrend</SelectItem>
                      <SelectItem value="daily">Täglich</SelectItem>
                      <SelectItem value="weekly">Wöchentlich</SelectItem>
                      <SelectItem value="monthly">Monatlich</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm mt-1 capitalize">{task.recurringPattern || "—"}</p>
                )}
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Erstellt: {format(new Date(task.createdAt), "dd.MM.yyyy HH:mm")}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><TagIcon className="h-4 w-4" /> Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const active = assignedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all border",
                        active ? "border-transparent" : "border-dashed opacity-50 hover:opacity-100"
                      )}
                      style={{
                        backgroundColor: active ? tag.color + "20" : "transparent",
                        color: tag.color,
                        borderColor: active ? "transparent" : tag.color,
                      }}
                    >
                      {active ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      {tag.name}
                    </button>
                  );
                })}
                {allTags.length === 0 && <p className="text-sm text-muted-foreground">Keine Tags vorhanden</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
