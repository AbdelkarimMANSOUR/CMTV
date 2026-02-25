import { Bot, CalendarClock, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo, useState } from "react";
import { InsightCard } from "../components/cards/InsightCard";
import { MetricCard } from "../components/cards/MetricCard";
import { RecommendationCard } from "../components/cards/RecommendationCard";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ENTITY_SCHEMAS } from "../config/entitySchemas";
import { useEntityCreate, useEntityList } from "../hooks/useEntities";
import { base44 } from "../lib/base44";
import type { AIReport, AIReportMetrics, Appointment, SocialPost, TVContent } from "../types/entities";

function buildMetrics(
  patientsCount: number,
  appointments: Appointment[],
  posts: SocialPost[],
  tvContents: TVContent[]
): AIReportMetrics {
  const rdvTotal = appointments.length;
  const rdvCompletes = appointments.filter((item) => item.statut === "termine").length;
  const rdvAnnules = appointments.filter((item) => item.statut === "annule").length;
  const engagementSocial = posts.reduce(
    (sum, post) => sum + post.metrics.likes + post.metrics.commentaires + post.metrics.partages,
    0
  );
  const contenusTVActifs = tvContents.filter((item) => item.actif).length;

  return {
    totalPatients: patientsCount,
    rdvTotal,
    rdvCompletes,
    rdvAnnules,
    engagementSocial,
    contenusTVActifs
  };
}

export function AIReportsPage() {
  const reportsQuery = useEntityList("AIReport");
  const patientsQuery = useEntityList("Patient");
  const appointmentsQuery = useEntityList("Appointment");
  const postsQuery = useEntityList("SocialPost");
  const tvQuery = useEntityList("TVContent");

  const createReport = useEntityCreate("AIReport");

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [generationLoading, setGenerationLoading] = useState(false);

  const reports = useMemo(() => {
    return [...(reportsQuery.data ?? [])].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  }, [reportsQuery.data]);

  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? reports[0] ?? null;

  async function generateReport(typePeriode: AIReport["typePeriode"]) {
    setGenerationLoading(true);
    try {
      const metrics = buildMetrics(
        patientsQuery.data?.length ?? 0,
        appointmentsQuery.data ?? [],
        postsQuery.data ?? [],
        tvQuery.data ?? []
      );

      const llmResponse = await base44.integrations.Core.InvokeLLM({
        prompt:
          typePeriode === "hebdo"
            ? "Génère un rapport hebdomadaire IA avec insights prioritaires pour un cabinet médical."
            : "Génère un rapport mensuel IA avec recommandations d'optimisation pour un cabinet médical.",
        response_json_schema: {
          type: "object",
          properties: {
            resume: ENTITY_SCHEMAS.AIReport.properties.resume,
            insights: ENTITY_SCHEMAS.AIReport.properties.insights,
            recommendations: ENTITY_SCHEMAS.AIReport.properties.recommendations
          }
        },
        context: { metrics }
      });

      const llmData = llmResponse.json as Partial<Pick<AIReport, "resume" | "insights" | "recommendations">>;
      const now = new Date();

      const newReportPayload: Omit<AIReport, "id" | "createdAt" | "updatedAt"> = {
        typePeriode,
        periodeLabel:
          typePeriode === "hebdo"
            ? `Semaine du ${format(now, "dd/MM/yyyy", { locale: fr })}`
            : `Mois ${format(now, "MMMM yyyy", { locale: fr })}`,
        generatedAt: now.toISOString(),
        metrics,
        resume:
          llmData.resume ??
          "Analyse automatique disponible. Vérifier les tendances de rendez-vous, engagement social et communication TV.",
        insights: llmData.insights ?? [],
        recommendations: llmData.recommendations ?? []
      };

      await createReport.mutateAsync(newReportPayload);
    } finally {
      setGenerationLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="app-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Rapports IA</p>
          <h1 className="text-2xl font-bold text-slate-900">Analyses hebdo/mensuelles</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void generateReport("hebdo")} disabled={generationLoading}>
            <Bot className="h-4 w-4" />
            Générer hebdo
          </Button>
          <Button variant="outline" onClick={() => void generateReport("mensuel")} disabled={generationLoading}>
            <RefreshCcw className="h-4 w-4" />
            Générer mensuel
          </Button>
        </div>
      </header>

      {selectedReport ? (
        <>
          <Card className="p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="social">{selectedReport.typePeriode}</Badge>
              <Badge tone="muted">{selectedReport.periodeLabel}</Badge>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <CalendarClock className="h-3.5 w-3.5" />
                {format(new Date(selectedReport.generatedAt), "dd/MM/yyyy HH:mm", { locale: fr })}
              </span>
            </div>
            <p className="text-sm text-slate-700">{selectedReport.resume}</p>
          </Card>

          <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <MetricCard label="Patients" value={selectedReport.metrics.totalPatients} />
            <MetricCard label="RDV total" value={selectedReport.metrics.rdvTotal} />
            <MetricCard label="RDV complétés" value={selectedReport.metrics.rdvCompletes} />
            <MetricCard label="RDV annulés" value={selectedReport.metrics.rdvAnnules} />
            <MetricCard label="Engagement social" value={selectedReport.metrics.engagementSocial} />
            <MetricCard label="Contenus TV actifs" value={selectedReport.metrics.contenusTVActifs} />
          </section>

          <section className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Insights IA</h2>
              {selectedReport.insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Recommandations</h2>
              {selectedReport.recommendations.map((recommendation) => (
                <RecommendationCard key={recommendation.id} recommendation={recommendation} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <Card className="p-5 text-sm text-slate-600">Aucun rapport généré. Lancez un premier rapport IA.</Card>
      )}

      <Card className="p-4">
        <h2 className="mb-3 text-base font-semibold">Historique rapports</h2>
        <div className="space-y-2">
          {reports.map((report) => (
            <button
              key={report.id}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left hover:bg-slate-50"
              type="button"
              onClick={() => setSelectedReportId(report.id)}
            >
              <div>
                <p className="font-medium text-slate-900">{report.periodeLabel}</p>
                <p className="text-xs text-slate-500">{format(new Date(report.generatedAt), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
              </div>
              <Badge tone="social">{report.typePeriode}</Badge>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
