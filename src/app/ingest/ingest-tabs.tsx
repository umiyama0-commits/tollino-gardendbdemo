"use client";

import { useState } from "react";
import Link from "next/link";
import { IngestForm } from "./ingest-form";
import { FileUpload } from "./file-upload";
import { BulkCapture } from "./bulk-capture";

type Tag = {
  id: string;
  code: string;
  displayNameJa: string;
  type: string;
  modelLayer: string | null;
};

export type ProjectOption = {
  id: string;
  name: string;
  clientName: string;
  status: string;
};

type Props = {
  tagsByType: Record<string, Tag[]>;
  projects: ProjectOption[];
};

const TABS = [
  { id: "bulk", label: "一括取込", icon: "📋" },
  { id: "manual", label: "手入力", icon: "✏️" },
  { id: "upload", label: "ファイル取込", icon: "📁" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function IngestTabs({ tagsByType, projects: initialProjects }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("bulk");
  const [projects, setProjects] = useState<ProjectOption[]>(initialProjects);
  const [projectId, setProjectId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const activeProject = projects.find((p) => p.id === projectId) || null;

  const createProject = async () => {
    const name = newName.trim();
    if (!name) {
      setCreateError("名称を入力してください");
      return;
    }
    setCreateError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "作成失敗");
      const next: ProjectOption = {
        id: data.id,
        name: data.name,
        clientName: data.client?.name || "未分類",
        status: data.status || "active",
      };
      setProjects((prev) => [next, ...prev]);
      setProjectId(next.id);
      setNewName("");
      setCreating(false);
    } catch (err) {
      setCreateError((err as Error).message);
    }
  };

  return (
    <div>
      {/* プロジェクトセレクタ */}
      <div className="mb-5 p-3 rounded-lg border border-zinc-200 bg-zinc-50/60">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            プロジェクト
          </span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="text-xs border border-zinc-300 rounded px-2 py-1 bg-white min-w-[240px] focus:outline-none focus:border-zinc-500"
          >
            <option value="">（未指定で取込）</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.clientName} / {p.name}
                {p.status !== "active" ? ` (${p.status})` : ""}
              </option>
            ))}
          </select>
          {!creating ? (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              ＋ 新規プロジェクト
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="プロジェクト名"
                className="text-xs border border-zinc-300 rounded px-2 py-1 w-48 focus:outline-none focus:border-zinc-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") createProject();
                  if (e.key === "Escape") {
                    setCreating(false);
                    setNewName("");
                    setCreateError(null);
                  }
                }}
              />
              <button
                type="button"
                onClick={createProject}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                作成
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setNewName("");
                  setCreateError(null);
                }}
                className="text-xs px-1 text-zinc-500 hover:text-zinc-700"
              >
                ✕
              </button>
            </div>
          )}
          {activeProject && (
            <Link
              href={`/projects/${activeProject.id}`}
              className="ml-auto text-xs text-violet-600 hover:text-violet-800 underline"
            >
              このPJのワークスペースを開く →
            </Link>
          )}
        </div>
        {createError && <p className="mt-1 text-xs text-red-600">{createError}</p>}
        {activeProject && (
          <p className="mt-1 text-[11px] text-emerald-700">
            以降の取込は「{activeProject.clientName} / {activeProject.name}」に紐付きます
          </p>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? "text-zinc-900"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "bulk" && (
        <BulkCapture tagsByType={tagsByType} projectId={projectId || null} />
      )}
      {activeTab === "manual" && (
        <IngestForm tagsByType={tagsByType} projectId={projectId || null} />
      )}
      {activeTab === "upload" && <FileUpload projectId={projectId || null} />}
    </div>
  );
}
