"use client";

import { motion } from "framer-motion";

export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="animate-pulse flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl"
        >
          <div className="h-5 w-5 bg-zinc-800 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-zinc-800 rounded w-2/3" />
            <div className="h-3 bg-zinc-800 rounded w-1/3" />
          </div>
          <div className="h-6 w-16 bg-zinc-800 rounded-full" />
        </motion.div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div className="h-5 bg-zinc-800 rounded w-1/2" />
      <div className="space-y-2">
        <div className="h-3 bg-zinc-800 rounded w-full" />
        <div className="h-3 bg-zinc-800 rounded w-3/4" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <TaskListSkeleton count={3} />
    </div>
  );
}
