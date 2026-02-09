"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Eye, Edit2, Columns } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview" | "split">("split");

  return (
    <div className="border border-zinc-700 rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 px-3 py-2 bg-zinc-800 border-b border-zinc-700">
        <button
          onClick={() => setMode("edit")}
          className={`p-1.5 rounded text-xs flex items-center gap-1 ${
            mode === "edit" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Edit2 className="h-3.5 w-3.5" /> Editor
        </button>
        <button
          onClick={() => setMode("split")}
          className={`p-1.5 rounded text-xs flex items-center gap-1 ${
            mode === "split" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Columns className="h-3.5 w-3.5" /> Split
        </button>
        <button
          onClick={() => setMode("preview")}
          className={`p-1.5 rounded text-xs flex items-center gap-1 ${
            mode === "preview" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Eye className="h-3.5 w-3.5" /> Preview
        </button>
      </div>

      <div className={`flex ${mode === "split" ? "divide-x divide-zinc-700" : ""}`}>
        {(mode === "edit" || mode === "split") && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Markdown schreiben..."}
            className={`${
              mode === "split" ? "w-1/2" : "w-full"
            } min-h-[300px] p-4 bg-zinc-900 text-zinc-200 text-sm font-mono resize-y outline-none placeholder-zinc-600`}
          />
        )}
        {(mode === "preview" || mode === "split") && (
          <div
            className={`${
              mode === "split" ? "w-1/2" : "w-full"
            } min-h-[300px] p-4 bg-zinc-950 overflow-y-auto prose prose-invert prose-sm max-w-none
            prose-headings:text-zinc-200 prose-p:text-zinc-300 prose-a:text-indigo-400
            prose-code:text-emerald-400 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-zinc-800 prose-pre:border prose-pre:border-zinc-700`}
          >
            {value ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <p className="text-zinc-600 italic">Vorschau erscheint hier...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
