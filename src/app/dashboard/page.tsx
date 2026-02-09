import { db } from "@/db";
import { tasks, projects, activityLog } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, ListTodo, FolderKanban, AlertTriangle, Activity } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [allTasks, allProjects, stats, overdueTasks, recentActivity] = await Promise.all([
    db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(5),
    db.select().from(projects).orderBy(desc(projects.createdAt)),
    db
      .select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) filter (where ${tasks.status} = 'open')::int`,
        inProgress: sql<number>`count(*) filter (where ${tasks.status} = 'in_progress')::int`,
        done: sql<number>`count(*) filter (where ${tasks.status} = 'done')::int`,
      })
      .from(tasks)
      .then((r) => r[0]),
    db.select().from(tasks).where(
      sql`${tasks.dueDate} < now() AND ${tasks.status} != 'done'`
    ),
    db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(10),
  ]);

  const statCards = [
    { label: "Gesamt", value: stats.total, icon: ListTodo, color: "text-foreground" },
    { label: "Offen", value: stats.open, icon: Circle, color: "text-gray-500" },
    { label: "In Bearbeitung", value: stats.inProgress, icon: Clock, color: "text-blue-500" },
    { label: "Erledigt", value: stats.done, icon: CheckCircle2, color: "text-green-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Übersicht über deine Aufgaben und Projekte</p>
      </div>

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
