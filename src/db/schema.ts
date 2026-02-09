import { pgTable, uuid, text, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const taskStatusEnum = pgEnum("task_status", [
  "open",
  "in_progress",
  "done",
]);

export const priorityEnum = pgEnum("priority", ["high", "medium", "low"]);

// ── Projects ──────────────────────────────────────────────
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
  notes: many(notes),
}));

// ── Tasks ─────────────────────────────────────────────────
export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").default("open").notNull(),
  priority: priorityEnum("priority").default("medium").notNull(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  startDate: timestamp("start_date"),
  pinned: boolean("pinned").default(false).notNull(),
  recurringPattern: text("recurring_pattern"), // "daily" | "weekly" | "monthly" | null
  recurringSourceId: uuid("recurring_source_id"),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  taskTags: many(taskTags),
  comments: many(comments),
  notes: many(notes),
}));

// ── Tags ──────────────────────────────────────────────────
export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#6366f1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  taskTags: many(taskTags),
}));

// ── Task ↔ Tags (M2M) ────────────────────────────────────
export const taskTags = pgTable("task_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
});

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, { fields: [taskTags.taskId], references: [tasks.id] }),
  tag: one(tags, { fields: [taskTags.tagId], references: [tags.id] }),
}));

// ── Comments ──────────────────────────────────────────────
export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  author: text("author").notNull().default("Cody"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, { fields: [comments.taskId], references: [tasks.id] }),
}));

// ── Notes ─────────────────────────────────────────────────
export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notesRelations = relations(notes, ({ one }) => ({
  project: one(projects, { fields: [notes.projectId], references: [projects.id] }),
  task: one(tasks, { fields: [notes.taskId], references: [tasks.id] }),
}));

// ── Activity Log ──────────────────────────────────────────
export const activityLog = pgTable("activity_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  entityTitle: text("entity_title"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Types ─────────────────────────────────────────────────
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type TaskTag = typeof taskTags.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
