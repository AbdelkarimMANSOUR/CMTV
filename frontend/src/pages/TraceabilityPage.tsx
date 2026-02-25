import { Download, FileClock, Network, ShieldCheck, WandSparkles } from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { useEntityList } from "../hooks/useEntities";
import { base44 } from "../lib/base44";
import { FLOW_STEP_LABELS } from "../types/entities";

function syncTone(status: string): "appointments" | "danger" | "muted" {
  if (status === "failed") {
    return "danger";
  }
  if (status === "synced") {
    return "appointments";
  }
  return "muted";
}

function networkTone(status: string): "appointments" | "danger" | "tv" {
  if (status === "connecte") {
    return "appointments";
  }
  if (status === "degrade") {
    return "tv";
  }
  return "danger";
}

export function TraceabilityPage() {
  const flowEvents = useEntityList("PatientFlowEvent").data ?? [];
  const auditLogs = useEntityList("AuditLog").data ?? [];
  const patients = useEntityList("Patient").data ?? [];
  const healthLinks = useEntityList("HealthNetworkLink").data ?? [];

  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedPatient, setSelectedPatient] = useState("all");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState<{ resume: string; alerts: string[]; recommendations: string[] } | null>(null);

  const patientMap = useMemo(() => new Map(patients.map((patient) => [patient.id, patient])), [patients]);

  const filteredFlow = useMemo(() => {
    return flowEvents
      .filter((event) => event.occuredAt.startsWith(selectedDate))
      .filter((event) => (selectedPatient === "all" ? true : event.patient_id === selectedPatient))
      .sort((a, b) => b.occuredAt.localeCompare(a.occuredAt));
  }, [flowEvents, selectedDate, selectedPatient]);

  const filteredAudit = useMemo(() => {
    return auditLogs
      .filter((log) => log.timestamp.startsWith(selectedDate))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [auditLogs, selectedDate]);

  const metrics = useMemo(() => {
    return {
      totalEvents: filteredFlow.length,
      arrivals: filteredFlow.filter((event) => event.step === "arrivee").length,
      departures: filteredFlow.filter((event) => event.step === "depart").length,
      pendingSync: filteredFlow.filter((event) => event.syncStatus === "pending").length,
      auditActions: filteredAudit.length
    };
  }, [filteredFlow, filteredAudit]);

  async function generateReport() {
    setReportLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: "Génère un rapport de traçabilité compliance pour un cabinet médical.",
        context: {
          date: selectedDate,
          metrics,
          events: filteredFlow.length,
          audit: filteredAudit.length
        }
      });

      const json = response.json as { resume?: string; alerts?: string[]; recommendations?: string[] };
      setReportData({
        resume: json?.resume ?? "Rapport généré.",
        alerts: json?.alerts ?? [],
        recommendations: json?.recommendations ?? []
      });
    } finally {
      setReportLoading(false);
    }
  }

  function exportTraceability() {
    const payload = {
      generatedAt: new Date().toISOString(),
      date: selectedDate,
      metrics,
      flow: filteredFlow,
      audit: filteredAudit
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `traceabilite-${selectedDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <header className="app-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Compliance & médical</p>
          <h1 className="text-2xl font-bold text-slate-900">Traçabilité des flux patients</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportTraceability}>
            <Download className="h-4 w-4" />
            Exporter JSON
          </Button>
          <Button onClick={() => void generateReport()} disabled={reportLoading}>
            <WandSparkles className="h-4 w-4" />
            Générer rapport IA
          </Button>
        </div>
      </header>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label-text">Date</label>
            <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </div>
          <div>
            <label className="label-text">Patient</label>
            <Select value={selectedPatient} onChange={(event) => setSelectedPatient(event.target.value)}>
              <option value="all">Tous</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.prenom} {patient.nom}</option>
              ))}
            </Select>
          </div>
          <div className="rounded-lg bg-violet-50 p-3">
            <p className="text-xs uppercase tracking-wide text-violet-700">Événements flux</p>
            <p className="text-2xl font-bold text-violet-900">{metrics.totalEvents}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-3">
            <p className="text-xs uppercase tracking-wide text-emerald-700">Actions audit</p>
            <p className="text-2xl font-bold text-emerald-900">{metrics.auditActions}</p>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileClock className="h-4 w-4 text-social" />
            <h2 className="text-base font-semibold">Timeline patient</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Patient</th>
                  <th>Étape</th>
                  <th>Source</th>
                  <th>Sync</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlow.map((event) => {
                  const patient = patientMap.get(event.patient_id);
                  return (
                    <tr key={event.id}>
                      <td>{new Date(event.occuredAt).toLocaleTimeString()}</td>
                      <td>{patient ? `${patient.prenom} ${patient.nom}` : "Inconnu"}</td>
                      <td>{FLOW_STEP_LABELS[event.step]}</td>
                      <td>
                        <p className="font-medium text-slate-900">{event.sourceSystem}</p>
                        <p className="text-xs text-slate-500">{event.externalReference || "-"}</p>
                      </td>
                      <td>
                        <Badge tone={syncTone(event.syncStatus)}>{event.syncStatus}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h2 className="text-base font-semibold">Logs d'audit</h2>
          </div>

          <div className="space-y-2">
            {filteredAudit.slice(0, 8).map((log) => (
              <div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{log.entity} • {log.action}</p>
                  <Badge tone="muted">{new Date(log.timestamp).toLocaleTimeString()}</Badge>
                </div>
                <p className="text-xs text-slate-600">{log.changesSummary}</p>
                <p className="text-xs text-slate-500">Actor: {log.actor} • Tag: {log.complianceTag}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Network className="h-4 w-4 text-tv" />
          <h2 className="text-base font-semibold">Réseaux de santé connectés</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {healthLinks.map((network) => (
            <div key={network.id} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-900">{network.nom}</p>
                <Badge tone={networkTone(network.statut)}>{network.statut}</Badge>
              </div>
              <p className="text-sm text-slate-600">{network.endpoint}</p>
              <p className="text-xs text-slate-500">{network.protocol} • Scope: {network.scope}</p>
              <p className="text-xs text-slate-500">Dernière sync: {new Date(network.lastSyncAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Card>

      {reportData ? (
        <Card className="p-4">
          <h2 className="mb-2 text-base font-semibold">Rapport IA de traçabilité</h2>
          <p className="text-sm text-slate-700">{reportData.resume}</p>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Alertes</p>
              <ul className="mt-1 space-y-1 text-sm text-slate-600">
                {reportData.alerts.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Recommandations</p>
              <ul className="mt-1 space-y-1 text-sm text-slate-600">
                {reportData.recommendations.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
