"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  doubleBackedCount: number;
  tripleBackedCount: number;
  fieldCount: number;
  anonCount: number;
  publicCount: number;
};

export function TrustChainCard({
  doubleBackedCount,
  tripleBackedCount,
  fieldCount,
  anonCount,
  publicCount,
}: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
          信頼度チェーン — Provenance 重複による裏付け
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-zinc-500 mb-5">
          同じテーマの知見が複数の Provenance 層で確認されるほど信頼度が高まります。
          固有知と公知が一致する知見は、実務と理論の両面から裏付けされた最高信頼度の知見です。
        </p>

        <div className="flex items-end gap-3">
          {/* Single layer */}
          <ChainColumn
            label="単層のみ"
            sublabel="1つの Provenance"
            count={fieldCount + anonCount + publicCount - doubleBackedCount}
            maxCount={fieldCount + anonCount + publicCount}
            level={1}
          />
          {/* Double backed */}
          <ChainColumn
            label="2層裏付け"
            sublabel="2つの Provenance で確認"
            count={doubleBackedCount - tripleBackedCount}
            maxCount={fieldCount + anonCount + publicCount}
            level={2}
          />
          {/* Triple backed */}
          <ChainColumn
            label="3層裏付け"
            sublabel="全 Provenance で確認"
            count={tripleBackedCount}
            maxCount={fieldCount + anonCount + publicCount}
            level={3}
          />
        </div>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <LegendItem
            layers={["①固有知"]}
            desc="実観測のみ"
            trust="基礎信頼"
            color="zinc"
          />
          <LegendItem
            layers={["①固有知", "②汎用知"]}
            desc="業種横断で再現確認"
            trust="高信頼"
            color="blue"
          />
          <LegendItem
            layers={["①固有知", "②汎用知", "③公知"]}
            desc="学術・理論でも裏付け"
            trust="最高信頼"
            color="emerald"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ChainColumn({
  label,
  sublabel,
  count,
  maxCount,
  level,
}: {
  label: string;
  sublabel: string;
  count: number;
  maxCount: number;
  level: 1 | 2 | 3;
}) {
  const height = maxCount > 0 ? Math.max((count / maxCount) * 120, 8) : 8;
  const colors = {
    1: "bg-zinc-200",
    2: "bg-blue-400",
    3: "bg-gradient-to-t from-emerald-500 to-emerald-400",
  };
  const ringColors = {
    1: "",
    2: "ring-2 ring-blue-200",
    3: "ring-2 ring-emerald-200",
  };

  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <span className="text-2xl font-bold tabular-nums">{count}</span>
      <div
        className={`w-full rounded-lg ${colors[level]} ${ringColors[level]} transition-all`}
        style={{ height: `${height}px` }}
      />
      <div className="text-center">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[10px] text-zinc-400">{sublabel}</p>
      </div>
    </div>
  );
}

function LegendItem({
  layers,
  desc,
  trust,
  color,
}: {
  layers: string[];
  desc: string;
  trust: string;
  color: string;
}) {
  const borderColor: Record<string, string> = {
    zinc: "border-zinc-200",
    blue: "border-blue-200",
    emerald: "border-emerald-200",
  };
  const bgColor: Record<string, string> = {
    zinc: "bg-zinc-50",
    blue: "bg-blue-50",
    emerald: "bg-emerald-50",
  };
  const textColor: Record<string, string> = {
    zinc: "text-zinc-600",
    blue: "text-blue-700",
    emerald: "text-emerald-700",
  };

  return (
    <div
      className={`rounded-lg border ${borderColor[color]} ${bgColor[color]} p-3`}
    >
      <div className="flex items-center gap-1 mb-1">
        {layers.map((l) => (
          <span key={l} className="text-[10px] font-medium text-zinc-500">
            {l}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-zinc-600">{desc}</p>
      <p className={`text-xs font-semibold mt-1 ${textColor[color]}`}>
        {trust}
      </p>
    </div>
  );
}
