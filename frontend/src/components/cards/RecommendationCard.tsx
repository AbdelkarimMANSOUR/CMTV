import { Sparkles } from "lucide-react";
import type { AIRecommendation } from "../../types/entities";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";

type RecommendationCardProps = {
  recommendation: AIRecommendation;
};

const impactToTone = {
  eleve: "appointments",
  moyen: "social",
  faible: "muted"
} as const;

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">{recommendation.titre}</p>
        <Badge tone={impactToTone[recommendation.impact]}>{recommendation.impact}</Badge>
      </div>
      <p className="text-sm text-slate-700">{recommendation.description}</p>
      <div className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500">
        <Sparkles className="h-3.5 w-3.5" />
        Impact {recommendation.impact}
      </div>
    </Card>
  );
}
