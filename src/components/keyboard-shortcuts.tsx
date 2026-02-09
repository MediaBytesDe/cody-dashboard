"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useRouter } from "next/navigation";

export function KeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Don't trigger in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "n":
          e.preventDefault();
          // Navigate to tasks and trigger new task
          router.push("/tasks");
          break;
        case "/":
          e.preventDefault();
          // Focus search input if exists
          const searchInput = document.querySelector('input[placeholder*="Such"]') as HTMLInputElement;
          if (searchInput) searchInput.focus();
          break;
        case "?":
          e.preventDefault();
          setShowHelp(true);
          break;
        case "d":
          e.preventDefault();
          router.push("/dashboard");
          break;
        case "t":
          e.preventDefault();
          router.push("/tasks");
          break;
        case "p":
          e.preventDefault();
          router.push("/projects");
          break;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  const shortcuts = [
    { key: "n", desc: "Aufgaben-Seite öffnen" },
    { key: "/", desc: "Suche fokussieren" },
    { key: "d", desc: "Dashboard" },
    { key: "t", desc: "Aufgaben" },
    { key: "p", desc: "Projekte" },
    { key: "?", desc: "Diese Hilfe anzeigen" },
  ];

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map(s => (
            <div key={s.key} className="flex items-center justify-between py-1">
              <span className="text-sm">{s.desc}</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">{s.key}</kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
