"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export function TreeActions({
  treeId,
  isTemplate,
  instanceCount,
}: {
  treeId: string;
  isTemplate: boolean;
  instanceCount: number;
}) {
  const router = useRouter();
  const [cloning, setCloning] = useState(false);

  const handleClone = async () => {
    setCloning(true);
    try {
      const res = await fetch("/api/admin/analysis-trees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `クローン - ${new Date().toLocaleDateString("ja-JP")}`,
          templateId: treeId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/analysis-trees/${data.id}`);
      }
    } finally {
      setCloning(false);
    }
  };

  if (!isTemplate) return null;

  return (
    <div className="flex items-center gap-3 shrink-0">
      <span className="text-xs text-zinc-400">{instanceCount}件のクローン</span>
      <button
        onClick={handleClone}
        disabled={cloning}
        className="px-3 py-1.5 text-xs font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50"
      >
        {cloning ? "クローン中..." : "PJにクローン"}
      </button>
    </div>
  );
}
