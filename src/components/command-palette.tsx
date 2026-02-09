"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, FileText, FolderOpen, CheckSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  tasks: any[];
  projects: any[];
  notes: any[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ tasks: [], projects: [], notes: [] });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults({ tasks: [], projects: [], notes: [] });
      setSelectedIndex(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults({ tasks: [], projects: [], notes: [] });
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setSelectedIndex(0);
    } catch {}
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const allItems = [
    ...results.tasks.map((t) => ({ type: "task" as const, id: t.id, title: t.title, subtitle: t.status })),
    ...results.projects.map((p) => ({ type: "project" as const, id: p.id, title: p.name, subtitle: p.description })),
    ...results.notes.map((n) => ({ type: "note" as const, id: n.id, title: n.title, subtitle: "Notiz" })),
  ];

  const navigate = (item: (typeof allItems)[0]) => {
    setOpen(false);
    if (item.type === "task") router.push(`/tasks/${item.id}`);
    else if (item.type === "project") router.push(`/projects/${item.id}`);
    else router.push(`/notes`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allItems[selectedIndex]) {
      navigate(allItems[selectedIndex]);
    }
  };

  const iconFor = (type: string) => {
    if (type === "task") return <CheckSquare className="h-4 w-4 text-blue-400" />;
    if (type === "project") return <FolderOpen className="h-4 w-4 text-green-400" />;
    return <FileText className="h-4 w-4 text-purple-400" />;
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
        <motion.div
          className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.95, y: -10 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-700">
            <Search className="h-5 w-5 text-zinc-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Suche nach Tasks, Projekten, Notizen..."
              className="flex-1 bg-transparent text-white placeholder-zinc-500 outline-none text-sm"
            />
            <kbd className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">ESC</kbd>
          </div>

          {allItems.length > 0 && (
            <div className="max-h-80 overflow-y-auto p-2">
              {results.tasks.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-zinc-500 px-2 py-1 font-medium">Tasks</div>
                  {results.tasks.map((t, i) => {
                    const idx = i;
                    return (
                      <button
                        key={t.id}
                        onClick={() => navigate({ type: "task", id: t.id, title: t.title, subtitle: t.status })}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          selectedIndex === idx ? "bg-zinc-800 text-white" : "text-zinc-300 hover:bg-zinc-800/50"
                        }`}
                      >
                        {iconFor("task")}
                        <span className="flex-1 truncate">{t.title}</span>
                        <span className="text-xs text-zinc-500">{t.status}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {results.projects.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-zinc-500 px-2 py-1 font-medium">Projekte</div>
                  {results.projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate({ type: "project", id: p.id, title: p.name, subtitle: p.description })}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                    >
                      {iconFor("project")}
                      <span className="flex-1 truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.notes.length > 0 && (
                <div>
                  <div className="text-xs text-zinc-500 px-2 py-1 font-medium">Notizen</div>
                  {results.notes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => navigate({ type: "note", id: n.id, title: n.title, subtitle: "Notiz" })}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors"
                    >
                      {iconFor("note")}
                      <span className="flex-1 truncate">{n.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {query.length >= 2 && allItems.length === 0 && (
            <div className="p-8 text-center text-sm text-zinc-500">
              Keine Ergebnisse für &quot;{query}&quot;
            </div>
          )}

          {query.length < 2 && (
            <div className="p-8 text-center text-sm text-zinc-500">
              Tippe mindestens 2 Zeichen ein...
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
