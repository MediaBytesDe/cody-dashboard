"use client";

import { useState, useEffect } from "react";
import { Clock, CalendarDays, Edit3, AlertCircle, GripVertical } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Widget {
  id: string;
  type: "clock" | "due-today" | "recently-edited";
  title: string;
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: "clock", type: "clock", title: "Uhrzeit & Datum" },
  { id: "due-today", type: "due-today", title: "Heute fällig" },
  { id: "recently-edited", type: "recently-edited", title: "Zuletzt bearbeitet" },
];

function ClockWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="text-center py-4">
      <div className="text-4xl font-mono font-bold text-white">
        {now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </div>
      <div className="text-sm text-zinc-400 mt-1">
        {now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </div>
    </div>
  );
}

function DueTodayWidget() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((all) => {
        const today = new Date().toISOString().split("T")[0];
        setTasks(all.filter((t: any) => t.dueDate?.startsWith(today) && t.status !== "done"));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <WidgetSkeleton />;

  return (
    <div className="space-y-2">
      {tasks.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-4">🎉 Nichts fällig heute!</p>
      ) : (
        tasks.map((t) => (
          <Link
            key={t.id}
            href={`/tasks/${t.id}`}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <AlertCircle className={`h-4 w-4 ${t.priority === "high" ? "text-red-400" : "text-yellow-400"}`} />
            <span className="text-sm text-zinc-300 truncate">{t.title}</span>
          </Link>
        ))
      )}
    </div>
  );
}

function RecentlyEditedWidget() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/notes").then((r) => r.json()),
    ])
      .then(([tasks, notes]) => {
        const all = [
          ...tasks.map((t: any) => ({ type: "task", id: t.id, title: t.title, date: t.createdAt })),
          ...notes.map((n: any) => ({ type: "note", id: n.id, title: n.title, date: n.updatedAt })),
        ]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        setItems(all);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <WidgetSkeleton />;

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-4">Noch keine Einträge</p>
      ) : (
        items.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            href={item.type === "task" ? `/tasks/${item.id}` : "/notes"}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Edit3 className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-300 truncate flex-1">{item.title}</span>
            <span className="text-xs text-zinc-600">
              {new Date(item.date).toLocaleDateString("de-DE")}
            </span>
          </Link>
        ))
      )}
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-8 bg-zinc-800 rounded-lg" />
      ))}
    </div>
  );
}

const widgetIcons: Record<string, React.ReactNode> = {
  clock: <Clock className="h-4 w-4" />,
  "due-today": <CalendarDays className="h-4 w-4" />,
  "recently-edited": <Edit3 className="h-4 w-4" />,
};

const widgetComponents: Record<string, () => React.ReactNode> = {
  clock: () => <ClockWidget />,
  "due-today": () => <DueTodayWidget />,
  "recently-edited": () => <RecentlyEditedWidget />,
};

export function DashboardWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newWidgets = [...widgets];
    const [moved] = newWidgets.splice(dragIdx, 1);
    newWidgets.splice(idx, 0, moved);
    setWidgets(newWidgets);
    setDragIdx(idx);
  };
  const handleDragEnd = () => setDragIdx(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {widgets.map((widget, idx) => (
        <motion.div
          key={widget.id}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e as any, idx)}
          onDragEnd={handleDragEnd}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className={`bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-grab active:cursor-grabbing ${
            dragIdx === idx ? "ring-2 ring-indigo-500" : ""
          }`}
        >
          <div className="flex items-center gap-2 mb-3 text-zinc-400">
            <GripVertical className="h-4 w-4 text-zinc-600" />
            {widgetIcons[widget.type]}
            <span className="text-sm font-medium">{widget.title}</span>
          </div>
          {widgetComponents[widget.type]()}
        </motion.div>
      ))}
    </div>
  );
}
