"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Project } from "@/db/schema";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Plus, Trash2, FolderKanban, ListTodo } from "lucide-react";
import { format } from "date-fns";

type ProjectWithCounts = Project & { taskCount: number; doneCount: number };

export function ProjectList({ projects }: { projects: ProjectWithCounts[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", description: "" });
    setShowNew(false);
    router.refresh();
  }

  async function deleteProject(id: string) {
    if (!confirm("Projekt wirklich löschen?")) return;
    await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4 mr-1" /> Neues Projekt
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <Card key={p.id} className="group hover:border-foreground/20 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <Link href={`/projects/${p.id}`} className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    {p.name}
                  </CardTitle>
                  {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                </Link>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8 shrink-0" onClick={() => deleteProject(p.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ListTodo className="h-4 w-4" />
                {p.doneCount}/{p.taskCount} erledigt
              </div>
              {p.taskCount > 0 && (
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(p.doneCount / p.taskCount) * 100}%` }} />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">Erstellt: {format(new Date(p.createdAt), "dd.MM.yyyy")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {projects.length === 0 && <p className="text-center text-muted-foreground py-8">Noch keine Projekte vorhanden</p>}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>Neues Projekt</DialogTitle></DialogHeader>
          <form onSubmit={createProject} className="space-y-4">
            <Input placeholder="Projektname" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Beschreibung (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
