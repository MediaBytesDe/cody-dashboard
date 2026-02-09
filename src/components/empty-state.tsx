"use client";

import { motion } from "framer-motion";
import { Plus, FileText, FolderOpen, CheckSquare } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  type: "tasks" | "projects" | "notes";
  onAction?: () => void;
}

const config = {
  tasks: {
    icon: CheckSquare,
    title: "Noch keine Aufgaben",
    description: "Erstelle deine erste Aufgabe und starte durch!",
    actionLabel: "Aufgabe erstellen",
    href: "/tasks",
  },
  projects: {
    icon: FolderOpen,
    title: "Keine Projekte vorhanden",
    description: "Organisiere deine Arbeit in Projekte.",
    actionLabel: "Projekt erstellen",
    href: "/projects",
  },
  notes: {
    icon: FileText,
    title: "Keine Notizen",
    description: "Halte deine Gedanken und Ideen fest.",
    actionLabel: "Notiz erstellen",
    href: "/notes",
  },
};

export function EmptyState({ type, onAction }: EmptyStateProps) {
  const c = config[type];
  const Icon = c.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-zinc-500" />
      </div>
      <h3 className="text-lg font-medium text-zinc-300 mb-1">{c.title}</h3>
      <p className="text-sm text-zinc-500 mb-6 max-w-xs">{c.description}</p>
      {onAction ? (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          {c.actionLabel}
        </button>
      ) : (
        <Link
          href={c.href}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          {c.actionLabel}
        </Link>
      )}
    </motion.div>
  );
}
