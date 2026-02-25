import type { ReactNode } from "react";
import { Card } from "../ui/card";
import { formatNumber } from "../../lib/utils";

type MetricCardProps = {
  label: string;
  value: number;
  hint?: string;
  icon?: ReactNode;
};

export function MetricCard({ label, value, hint, icon }: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{formatNumber(value)}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </Card>
  );
}
