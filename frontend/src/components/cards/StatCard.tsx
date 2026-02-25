import { ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn, formatNumber, toPercent } from "../../lib/utils";

type StatCardProps = {
  icon: LucideIcon;
  title: string;
  value: number;
  trend?: number;
  color: "patients" | "appointments" | "social" | "tv";
};

const colorMap = {
  patients: "text-patients bg-blue-50",
  appointments: "text-appointments bg-emerald-50",
  social: "text-social bg-violet-50",
  tv: "text-tv bg-amber-50"
};

export function StatCard({ icon: Icon, title, value, trend, color }: StatCardProps) {
  return (
    <Card className="p-4">
      <CardHeader className="mb-2">
        <CardTitle className="text-slate-600">{title}</CardTitle>
        <div className={cn("rounded-lg p-2", colorMap[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-slate-900">{formatNumber(value)}</p>
        {typeof trend === "number" ? (
          <div className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600">
            <ArrowUpRight className="h-3.5 w-3.5" />
            {toPercent(trend)}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
