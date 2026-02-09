import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

const INBOX_PATH =
  "/Users/silence/Library/CloudStorage/OneDrive-MediaBytes/Obsidian/OpenClaw/Cody/Inbox";

interface ParsedTask {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueDate: string | null;
  tags: string[];
  status: "open" | "in_progress" | "done";
  filePath: string;
  fileName: string;
}

function parseObsidianFile(content: string, fileName: string, filePath: string): ParsedTask {
  const lines = content.split("\n");
  let title = fileName.replace(/\.md$/, "");
  let description = "";
  let priority: "high" | "medium" | "low" = "medium";
  let dueDate: string | null = null;
  let tags: string[] = [];
  let status: "open" | "in_progress" | "done" = "open";
  let inFrontmatter = false;
  let frontmatterDone = false;
  const bodyLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === "---" && !frontmatterDone) {
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      } else {
        inFrontmatter = false;
        frontmatterDone = true;
        continue;
      }
    }
    if (inFrontmatter) {
      const [key, ...rest] = line.split(":");
      const val = rest.join(":").trim();
      switch (key.trim()) {
        case "priority":
          if (["high", "medium", "low"].includes(val)) priority = val as any;
          break;
        case "due":
        case "dueDate":
          if (val) dueDate = val;
          break;
        case "tags":
          tags = val.split(",").map((t) => t.trim()).filter(Boolean);
          break;
        case "status":
          if (["open", "in_progress", "done"].includes(val)) status = val as any;
          break;
        case "title":
          if (val) title = val;
          break;
      }
    } else {
      // First heading as title
      if (line.startsWith("# ") && !frontmatterDone && bodyLines.length === 0) {
        title = line.slice(2).trim();
        continue;
      }
      bodyLines.push(line);
    }
  }

  description = bodyLines.join("\n").trim();
  return { title, description, priority, dueDate, tags, status, filePath, fileName };
}

function updateObsidianFrontmatter(
  content: string,
  status: string
): string {
  const lines = content.split("\n");
  let inFm = false;
  let hasFm = false;
  let statusSet = false;
  const result: string[] = [];

  for (const line of lines) {
    if (line.trim() === "---") {
      if (!hasFm) {
        hasFm = true;
        inFm = true;
        result.push(line);
        continue;
      } else if (inFm) {
        if (!statusSet) {
          result.push(`status: ${status}`);
          result.push(`synced: ${new Date().toISOString()}`);
        }
        inFm = false;
        result.push(line);
        continue;
      }
    }
    if (inFm && line.startsWith("status:")) {
      result.push(`status: ${status}`);
      statusSet = true;
      continue;
    }
    if (inFm && line.startsWith("synced:")) {
      result.push(`synced: ${new Date().toISOString()}`);
      continue;
    }
    result.push(line);
  }

  if (!hasFm) {
    return `---\nstatus: ${status}\nsynced: ${new Date().toISOString()}\n---\n${content}`;
  }
  return result.join("\n");
}

// POST: Import from Obsidian Inbox
export async function POST() {
  try {
    let files: string[];
    try {
      files = await readdir(INBOX_PATH);
    } catch {
      return NextResponse.json(
        { error: "Obsidian Inbox nicht erreichbar", path: INBOX_PATH },
        { status: 404 }
      );
    }

    const mdFiles = files.filter((f) => f.endsWith(".md"));
    const imported: string[] = [];

    for (const fileName of mdFiles) {
      const filePath = join(INBOX_PATH, fileName);
      const content = await readFile(filePath, "utf-8");
      const parsed = parseObsidianFile(content, fileName, filePath);

      const [task] = await db
        .insert(tasks)
        .values({
          title: parsed.title,
          description: parsed.description || null,
          status: parsed.status,
          priority: parsed.priority,
          dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        })
        .returning();

      // Write back synced status
      const updated = updateObsidianFrontmatter(content, parsed.status);
      await writeFile(filePath, updated, "utf-8");

      await logActivity("created", "task", task.id, task.title, "Importiert aus Obsidian");
      imported.push(parsed.title);
    }

    return NextResponse.json({
      imported: imported.length,
      tasks: imported,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Sync status back to Obsidian files
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, status } = body;

    // Find the task
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    if (!task) {
      return NextResponse.json({ error: "Task nicht gefunden" }, { status: 404 });
    }

    // Try to find matching file
    let files: string[];
    try {
      files = await readdir(INBOX_PATH);
    } catch {
      return NextResponse.json({ error: "Obsidian Inbox nicht erreichbar" }, { status: 404 });
    }

    const mdFiles = files.filter((f) => f.endsWith(".md"));
    let synced = false;

    for (const fileName of mdFiles) {
      const filePath = join(INBOX_PATH, fileName);
      const content = await readFile(filePath, "utf-8");
      const parsed = parseObsidianFile(content, fileName, filePath);

      if (parsed.title === task.title) {
        const updated = updateObsidianFrontmatter(content, status);
        await writeFile(filePath, updated, "utf-8");
        synced = true;
        break;
      }
    }

    return NextResponse.json({ synced, taskTitle: task.title });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
