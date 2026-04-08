"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MODEL_LAYER_CONFIG,
  VALUE_AXIS_CONFIG,
  PROVENANCE_CONFIG,
} from "@/lib/constants";

type TagRelation = {
  tag: { id: string; code: string; displayNameJa: string; type: string };
};

type ObsResult = {
  id: string;
  text: string;
  modelLayer: string;
  primaryValueAxis: string | null;
  provenance: string;
  tags: TagRelation[];
  store?: { client: { industry: string; industryDetail: string | null } } | null;
  project?: { client: { industry: string; industryDetail: string | null } } | null;
};

type InsightResult = {
  id: string;
  text: string;
  modelLayer: string | null;
  primaryValueAxis: string | null;
  provenance: string;
  tags: TagRelation[];
};

type SearchResult = {
  observations: ObsResult[];
  insights: InsightResult[];
  industries: string[];
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [industries, setIndustries] = useState<string[]>([]);

  // Load industries on mount
  useEffect(() => {
    fetch("/api/industries")
      .then((r) => r.json())
      .then((d) => setIndustries(d.industries || []));
  }, []);

  const handleSearch = async () => {
    if (!query.trim() && !industry) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query);
      if (industry) params.set("industry", industry);
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setResults(data);
      if (data.industries?.length) setIndustries(data.industries);
    } finally {
      setLoading(false);
    }
  };

  // Group observations by provenance for trust chain display
  const provenanceGroups = results
    ? {
        FIELD_OBSERVED: results.observations.filter((o) => o.provenance === "FIELD_OBSERVED"),
        ANONYMIZED_DERIVED: results.observations.filter((o) => o.provenance === "ANONYMIZED_DERIVED"),
        PUBLIC_CODIFIED: results.observations.filter((o) => o.provenance === "PUBLIC_CODIFIED"),
      }
    : null;

  // Find matching themes across provenances (by shared tags)
  const trustChainMatches = results ? findTrustChain(results.observations) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">検索</h1>
        <p className="text-zinc-500 mt-1 text-sm">
          観測データと洞察を横断検索。業種で絞り込み、信頼度チェーンで確認。
        </p>
      </div>

      {/* Search bar + Industry filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="キーワードで検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="sm:max-w-md bg-white"
        />
        <div className="flex gap-1.5 flex-wrap items-center">
          <Badge
            variant={industry === "" ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => setIndustry("")}
          >
            全業種
          </Badge>
          {industries.map((ind) => (
            <Badge
              key={ind}
              variant={industry === ind ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setIndustry(ind === industry ? "" : ind)}
            >
              {ind}
            </Badge>
          ))}
        </div>
        <Button onClick={handleSearch} disabled={loading} className="sm:w-auto">
          {loading ? "検索中..." : "検索"}
        </Button>
      </div>

      {results && (
        <div className="space-y-6">
          {/* Trust Chain highlight */}
          {trustChainMatches.length > 0 && (
            <Card className="shadow-sm border-emerald-200 bg-gradient-to-r from-emerald-50 to-white">
              <CardContent className="pt-5 pb-5">
                <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-3">
                  多層裏付けあり — 高信頼知見
                </p>
                <div className="space-y-3">
                  {trustChainMatches.map((match) => (
                    <div
                      key={match.tagCode}
                      className="bg-white rounded-lg border border-emerald-100 p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs">
                          {match.provenances.length}層裏付け
                        </Badge>
                        <span className="text-xs text-zinc-500">
                          テーマ: {match.tagName}
                        </span>
                      </div>
                      <div className="grid gap-2">
                        {match.provenances.map((prov) => {
                          const cfg = PROVENANCE_CONFIG[prov.provenance];
                          return (
                            <div key={prov.provenance} className="flex gap-3 items-start">
                              <div className="flex items-center gap-1.5 w-20 shrink-0">
                                <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                <span className="text-[11px] font-medium text-zinc-500">
                                  {cfg.shortLabel}
                                </span>
                              </div>
                              <p className="text-sm text-zinc-700">
                                {prov.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Provenance summary */}
          {provenanceGroups && (
            <div className="flex gap-4">
              {Object.entries(PROVENANCE_CONFIG).map(([key, config]) => {
                const count =
                  provenanceGroups[key as keyof typeof provenanceGroups]?.length || 0;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
                    <span className="text-xs text-zinc-600">
                      {config.shortLabel}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Observations */}
          {results.observations.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
                観測データ ({results.observations.length}件)
              </h2>
              <div className="space-y-2">
                {results.observations.map((obs) => (
                  <ObservationCard key={obs.id} obs={obs} />
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {results.insights.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
                洞察 ({results.insights.length}件)
              </h2>
              <div className="space-y-2">
                {results.insights.map((ins) => (
                  <InsightCard key={ins.id} ins={ins} />
                ))}
              </div>
            </div>
          )}

          {results.observations.length === 0 &&
            results.insights.length === 0 && (
              <p className="text-zinc-400 text-sm py-8 text-center">
                該当する結果がありません
              </p>
            )}
        </div>
      )}
    </div>
  );
}

function ObservationCard({ obs }: { obs: ObsResult }) {
  const layerConfig = MODEL_LAYER_CONFIG[obs.modelLayer];
  const valueConfig = obs.primaryValueAxis
    ? VALUE_AXIS_CONFIG[obs.primaryValueAxis]
    : null;
  const provConfig = PROVENANCE_CONFIG[obs.provenance];
  const clientIndustry =
    obs.store?.client?.industryDetail ||
    obs.store?.client?.industry ||
    obs.project?.client?.industryDetail ||
    obs.project?.client?.industry;

  return (
    <Card className="shadow-sm hover:shadow transition-shadow">
      <CardContent className="pt-4 pb-4">
        <p className="text-sm leading-relaxed mb-2.5">{obs.text}</p>
        <div className="flex flex-wrap gap-1.5">
          {provConfig && (
            <Badge className={`${provConfig.bg} ${provConfig.color} text-[11px] px-1.5 py-0`}>
              {provConfig.shortLabel}
            </Badge>
          )}
          {layerConfig && (
            <Badge className={`${layerConfig.bg} ${layerConfig.color} text-[11px] px-1.5 py-0`}>
              {layerConfig.label}
            </Badge>
          )}
          {valueConfig && (
            <Badge className={`${valueConfig.bg} ${valueConfig.color} text-[11px] px-1.5 py-0`}>
              {valueConfig.label}
            </Badge>
          )}
          {clientIndustry && (
            <Badge className="bg-violet-50 border border-violet-200 text-violet-700 text-[11px] px-1.5 py-0">
              {clientIndustry}
            </Badge>
          )}
          {obs.tags.map((t) => (
            <Badge
              key={t.tag.id}
              variant="outline"
              className={`text-[11px] px-1.5 py-0 ${
                t.tag.type === "THEORY"
                  ? "border-purple-200 text-purple-600 bg-purple-50"
                  : "border-zinc-200"
              }`}
            >
              {t.tag.displayNameJa}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard({ ins }: { ins: InsightResult }) {
  const layerConfig = ins.modelLayer ? MODEL_LAYER_CONFIG[ins.modelLayer] : null;
  const valueConfig = ins.primaryValueAxis
    ? VALUE_AXIS_CONFIG[ins.primaryValueAxis]
    : null;

  return (
    <Card className="shadow-sm hover:shadow transition-shadow border-l-4 border-l-cyan-400">
      <CardContent className="pt-4 pb-4">
        <p className="text-sm leading-relaxed mb-2.5">{ins.text}</p>
        <div className="flex flex-wrap gap-1.5">
          {layerConfig && (
            <Badge className={`${layerConfig.bg} ${layerConfig.color} text-[11px] px-1.5 py-0`}>
              {layerConfig.label}
            </Badge>
          )}
          {valueConfig && (
            <Badge className={`${valueConfig.bg} ${valueConfig.color} text-[11px] px-1.5 py-0`}>
              {valueConfig.label}
            </Badge>
          )}
          {ins.tags.map((t) => (
            <Badge
              key={t.tag.id}
              variant="outline"
              className={`text-[11px] px-1.5 py-0 ${
                t.tag.type === "THEORY"
                  ? "border-purple-200 text-purple-600 bg-purple-50"
                  : "border-zinc-200"
              }`}
            >
              {t.tag.displayNameJa}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Find observations that share tags across different provenance levels
function findTrustChain(observations: ObsResult[]) {
  const tagGroups: Record<
    string,
    { tagName: string; tagCode: string; entries: { provenance: string; text: string }[] }
  > = {};

  for (const obs of observations) {
    for (const t of obs.tags) {
      if (!tagGroups[t.tag.code]) {
        tagGroups[t.tag.code] = {
          tagName: t.tag.displayNameJa,
          tagCode: t.tag.code,
          entries: [],
        };
      }
      // Avoid duplicates per provenance
      const existing = tagGroups[t.tag.code].entries.find(
        (e) => e.provenance === obs.provenance
      );
      if (!existing) {
        tagGroups[t.tag.code].entries.push({
          provenance: obs.provenance,
          text: obs.text,
        });
      }
    }
  }

  return Object.values(tagGroups)
    .filter((g) => g.entries.length >= 2)
    .map((g) => ({
      tagCode: g.tagCode,
      tagName: g.tagName,
      provenances: g.entries.sort((a, b) => {
        const order = ["FIELD_OBSERVED", "ANONYMIZED_DERIVED", "PUBLIC_CODIFIED"];
        return order.indexOf(a.provenance) - order.indexOf(b.provenance);
      }),
    }))
    .sort((a, b) => b.provenances.length - a.provenances.length);
}
