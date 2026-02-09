"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileText, Save, FolderKanban, ListTodo, Eye, Edit3 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string | null;
  projectId: string | null;
  taskId: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string } | null;
  task?: { id: string; title: string } | null;
}

interface Project { id: string; name: string; }
interface Task { id: string; title: string; }

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<Note | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", projectId: "", taskId: "" });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const [notesRes, projectsRes, tasksRes] = await Promise.all([
      fetch("/api/notes").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
    ]);
    setNotes(notesRes);
    setProjects(projectsRes);
    setTasks(tasksRes);
  }, []);

  useEffect(() => { load(); }, [load]);

  function selectNote(note: Note) {
    setSelected(note);
    setForm({ title: note.title, content: note.content || "", projectId: note.projectId || "", taskId: note.taskId || "" });
    setEditing(false);
    setCreating(false);
  }

  async function createNote() {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Neue Notiz", content: "" }),
    });
    const note = await res.json();
    toast.success("Notiz erstellt");
    await load();
    setSelected(note);
    setForm({ title: note.title, content: "", projectId: "", taskId: "" });
    setEditing(true);
    setCreating(false);
  }

  async function saveNote() {
    if (!selected) return;
    await fetch(`/api/notes/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    toast.success("Notiz gespeichert");
    setEditing(false);
    await load();
  }

  async function deleteNote(id: string) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    toast.success("Notiz gelöscht");
    if (selected?.id === id) { setSelected(null); }
    await load();
  }

  return (
    <div className="flex h-full">
      {/* Sidebar - Note List */}
      <div className="w-80 border-r flex flex-col bg-card">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Notizen</h2>
          <Button size="sm" onClick={createNote}><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notes.map(note => (
            <div
              key={note.id}
              onClick={() => selectNote(note)}
              className={cn(
                "p-3 border-b cursor-pointer hover:bg-accent/50 transition-colors",
                selected?.id === note.id && "bg-accent"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm truncate flex-1">{note.title}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="text-muted-foreground hover:text-destructive shrink-0 ml-2">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {note.project && <span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" />{note.project.name}</span>}
                {note.task && <span className="flex items-center gap-1"><ListTodo className="h-3 w-3" />{note.task.title}</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(note.updatedAt), "dd.MM.yyyy HH:mm")}
              </p>
            </div>
          ))}
          {notes.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Keine Notizen</p>}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              {editing ? (
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="text-lg font-bold flex-1" />
              ) : (
                <h1 className="text-lg font-bold flex-1">{selected.title}</h1>
              )}
              <div className="flex gap-2">
                {editing ? (
                  <Button onClick={saveNote}><Save className="h-4 w-4 mr-1" /> Speichern</Button>
                ) : (
                  <Button variant="outline" onClick={() => setEditing(true)}><Edit3 className="h-4 w-4 mr-1" /> Bearbeiten</Button>
                )}
              </div>
            </div>

            {editing && (
              <div className="px-4 py-2 border-b flex gap-3">
                <Select value={form.projectId || "none"} onValueChange={v => setForm({ ...form, projectId: v === "none" ? "" : v })}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Projekt verknüpfen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Projekt</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.taskId || "none"} onValueChange={v => setForm({ ...form, taskId: v === "none" ? "" : v })}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Task verknüpfen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Task</SelectItem>
                    {tasks.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {editing ? (
                <Textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Markdown schreiben..."
                />
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{selected.content || "*Keine Inhalte*"}</ReactMarkdown>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Wähle eine Notiz aus oder erstelle eine neue</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
