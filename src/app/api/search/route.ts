import { db } from "@/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";

  if (!q || q.length < 2) {
    return NextResponse.json({ tasks: [], projects: [], notes: [] });
  }

  const [allTasks, allProjects, allNotes] = await Promise.all([
    db.query.tasks.findMany({ with: { taskTags: { with: { tag: true } } } }),
    db.query.projects.findMany(),
    db.query.notes.findMany(),
  ]);

  // Simple fuzzy: check if all chars of query appear in order
  function fuzzyMatch(text: string, query: string): boolean {
    const t = text.toLowerCase();
    let qi = 0;
    for (let i = 0; i < t.length && qi < query.length; i++) {
      if (t[i] === query[qi]) qi++;
    }
    return qi === query.length;
  }

  function score(text: string, query: string): number {
    const t = text.toLowerCase();
    if (t === query) return 100;
    if (t.startsWith(query)) return 90;
    if (t.includes(query)) return 80;
    return fuzzyMatch(t, query) ? 60 : 0;
  }

  const taskResults = allTasks
    .map((t) => ({
      ...t,
      _score: Math.max(
        score(t.title, q),
        score(t.description || "", q) * 0.7
      ),
    }))
    .filter((t) => t._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 10);

  const projectResults = allProjects
    .map((p) => ({
      ...p,
      _score: Math.max(
        score(p.name, q),
        score(p.description || "", q) * 0.7
      ),
    }))
    .filter((p) => p._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 5);

  const noteResults = allNotes
    .map((n) => ({
      ...n,
      _score: Math.max(
        score(n.title, q),
        score(n.content || "", q) * 0.5
      ),
    }))
    .filter((n) => n._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 5);

  return NextResponse.json({
    tasks: taskResults,
    projects: projectResults,
    notes: noteResults,
  });
}
