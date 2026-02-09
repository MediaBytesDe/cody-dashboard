"use client";

import { Task, Project, ActivityLogEntry } from "@/db/schema";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2, Circle, Clock, ListTodo, FolderKanban, AlertTriangle,
  Activity, Pin, PinOff, Plus, Repeat,
} from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface Props {
  tasks: Task[];
  projects: Project[];
  stats: { total: number; open: number; inProgress: number; done: number };
  overdueTasks: Task[];
  recentActivity: ActivityLogEntry[];
  pinnedTasks: Task[];
  weeklyStats: { week: string; done: number; open: number; in_progress: number }[];
}

const PIE_COLORS = ["#6b7280", "#3b82f6", "#22c55e"];

export function DashboardClient({ tasks: allTasks, projects: allProjects, stats, overdueTasks, recentActivity, pinnedTasks, weeklyStats }: Props) {
  const router = useRouter();
  const [quickTitle, setQuickTitle] = useState("");
  const [quickProject, setQuickProject] = useState("");

  async function quickCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: quickTitle, projectId: quickProject || null }),
    });
    setQuickTitle("");
    toast.success("Task erstellt");
    router.refresh();
  }

  async function togglePin(id: string, pinned: boolean) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pinned: !pinned }),
    });
    toast.success(pinned ? "Task losgelöst" : "Task angepinnt");
    router.refresh();
  }

  const statCards = [
    { label: "Gesamt", value: stats.total, icon: ListTodo, color: "text-foreground" },
    { label: "Offen", value: stats.open, icon: Circle, color: "text-gray-500" },
    { label: "In Bearbeitung", value: stats.inProgress, icon: Clock, color: "text-blue-500" },
    { label: "Erledigt", value: stats.done, icon: CheckCircle2, color: "text-green-500" },
  ];

  const pieData = [
    { name: "Offen", value: stats.open },
    { name: "In Bearbeitung", value: stats.inProgress },
    { name: "Erledigt", value: stats.done },
  ].filter(d => d.value > 0);

  const barData = weeklyStats.map(w => ({
    week: format(new Date(w.week), "dd.MM.", { locale: de }),
    Erledigt: w.done,
    Offen: w.open,
    "In Bearbeitung": w.in_progress,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Übersicht über deine Aufgaben und Projekte</p>
      </div>

      {/* Quick Action */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={quickCreate} className="flex gap-3">
            <Input
              placeholder="Schnell einen Task erstellen..."
              value={quickTitle}
              onChange={e => setQuickTitle(e.target.value)}
              className="flex-1"
            />
            <Select value={quickProject || "none"} onValueChange={v => setQuickProject(v === "none" ? "" : v)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Projekt" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Projekt</SelectItem>
                {allProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="submit"><Plus className="h-4 w-4 mr-1" /> Erstellen</Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pinned Tasks */}
      {pinnedTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Pin className="h-4 w-4" /> Angepinnte Aufgaben</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pinnedTasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 text-sm">
                <Link href={`/tasks/${t.id}`} className="flex-1 hover:underline flex items-center gap-2">
                  {t.recurringPattern && <Repeat className="h-3 w-3 text-muted-foreground" />}
                  <span>{t.title}</span>
                </Link>
                <Badge variant="outline" className="text-xs capitalize">{t.status.replace("_", " ")}</Badge>
                <button onClick={() => togglePin(t.id, true)} className="text-muted-foreground hover:text-foreground">
                  <PinOff className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Overdue Warning */}
      {overdueTasks.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> {overdueTasks.length} überfällige Aufgabe{overdueTasks.length > 1 ? "n" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueTasks.map((t) => (
              <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center justify-between text-sm hover:bg-accent rounded-md p-2 -mx-2">
                <span>{t.title}</span>
                <Badge variant="destructive" className="text-xs">
                  Fällig: {t.dueDate ? format(new Date(t.dueDate), "dd.MM.yyyy") : ""}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tasks nach Status</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Keine Daten</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tasks pro Woche</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <XAxis dataKey="week" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="Erledigt" fill="#22c55e" />
                  <Bar dataKey="Offen" fill="#6b7280" />
                  <Bar dataKey="In Bearbeitung" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Keine Daten</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Neueste Aufgaben</CardTitle>
              <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground">Alle →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {allTasks.map((t) => {
              const statusColors: Record<string, string> = { open: "bg-gray-500", in_progress: "bg-blue-500", done: "bg-green-500" };
              return (
                <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center gap-3 text-sm hover:bg-accent rounded-md p-2 -mx-2">
                  <div className={`h-2 w-2 rounded-full ${statusColors[t.status]}`} />
                  <span className="flex-1 truncate">{t.title}</span>
                  {t.recurringPattern && <Repeat className="h-3 w-3 text-muted-foreground" />}
                  <button
                    onClick={(e) => { e.preventDefault(); togglePin(t.id, t.pinned); }}
                    className={cn("text-muted-foreground hover:text-foreground", t.pinned && "text-yellow-500")}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>
                  <Badge variant="outline" className="text-xs capitalize">{t.priority}</Badge>
                </Link>
              );
            })}
            {allTasks.length === 0 && <p className="text-sm text-muted-foreground">Keine Aufgaben vorhanden</p>}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Projekte</CardTitle>
              <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground">Alle →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {allProjects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center gap-3 hover:bg-accent rounded-md p-2 -mx-2">
                <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
                </div>
              </Link>
            ))}
            {allProjects.length === 0 && <p className="text-sm text-muted-foreground">Keine Projekte vorhanden</p>}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" /> Letzte Aktivitäten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                <span className="flex-1">
                  <span className="font-medium">{a.entityTitle || a.entityType}</span>
                  {" — "}
                  <span className="text-muted-foreground">{a.action}{a.details ? `: ${a.details}` : ""}</span>
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {format(new Date(a.createdAt), "dd.MM. HH:mm", { locale: de })}
                </span>
              </div>
            ))}
            {recentActivity.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Aktivitäten</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
