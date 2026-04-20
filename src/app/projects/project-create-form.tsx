"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ProjectCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [theme, setTheme] = useState("");
  const [valueAxis, setValueAxis] = useState("");
  const [targetKPI, setTargetKPI] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!name.trim()) {
      setError("プロジェクト名は必須です");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          hypothesisTheme: theme.trim() || null,
          primaryValueAxis: valueAxis || null,
          targetKPI: targetKPI.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "作成失敗");
      setOpen(false);
      setName("");
      setTheme("");
      setValueAxis("");
      setTargetKPI("");
      router.refresh();
      router.push(`/projects/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)} className="text-xs h-8">
        ＋ 新規プロジェクト
      </Button>
    );
  }

  return (
    <div className="p-4 rounded-lg border border-zinc-200 bg-white shadow-sm w-[380px] space-y-2">
      <p className="text-xs font-medium text-zinc-700">新規プロジェクト作成</p>
      <div>
        <label className="text-[11px] text-zinc-500">プロジェクト名 *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full text-xs border border-zinc-300 rounded px-2 py-1 mt-0.5 focus:outline-none focus:border-zinc-500"
          autoFocus
        />
      </div>
      <div>
        <label className="text-[11px] text-zinc-500">仮説テーマ</label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="例: 接客転換率 +10% 改善"
          className="w-full text-xs border border-zinc-300 rounded px-2 py-1 mt-0.5 focus:outline-none focus:border-zinc-500"
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[11px] text-zinc-500">価値軸</label>
          <select
            value={valueAxis}
            onChange={(e) => setValueAxis(e.target.value)}
            className="w-full text-xs border border-zinc-300 rounded px-2 py-1 mt-0.5 bg-white focus:outline-none"
          >
            <option value="">（未指定）</option>
            <option value="REVENUE_UP">売上向上</option>
            <option value="COST_DOWN">コスト削減</option>
            <option value="RETENTION">継続率向上</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[11px] text-zinc-500">ターゲットKPI</label>
          <input
            type="text"
            value={targetKPI}
            onChange={(e) => setTargetKPI(e.target.value)}
            placeholder="例: 転換率"
            className="w-full text-xs border border-zinc-300 rounded px-2 py-1 mt-0.5 focus:outline-none focus:border-zinc-500"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={submit} disabled={saving} className="text-xs h-7">
          {saving ? "作成中..." : "作成"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={saving}
          className="text-xs h-7"
        >
          キャンセル
        </Button>
      </div>
    </div>
  );
}
