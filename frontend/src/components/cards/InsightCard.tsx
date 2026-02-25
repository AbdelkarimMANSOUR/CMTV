import { AlertCircle } from "lucide-react";
import type { AIInsight } from "../../types/entities";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";

type InsightCardProps = {
  insight: AIInsight;
};

const priorityToTone = {
  haute: "danger",
  moyenne: "tv",
  basse: "muted"
} as const;

export function InsightCard({ insight }: InsightCardProps) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{insight.titre}</p>
          <p className="text-xs text-slate-500">{insight.categorie}</p>
        </div>
        <Badge tone={priorityToTone[insight.priorite]}>{insight.priorite}</Badge>
      </div>
      <p className="text-sm text-slate-700">{insight.description}</p>
      <div className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500">
        <AlertCircle className="h-3.5 w-3.5" />
        Priorité {insight.priorite}
      </div>
    </Card>
  );
}
