import { CalendarCheck2, MonitorPlay, Plus, ShieldCheck, Users, WandSparkles, Wifi } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { StatCard } from "../components/cards/StatCard";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { Select } from "../components/ui/select";
import { useEntityList, useEntityUpdate } from "../hooks/useEntities";
import { APPOINTMENT_STATUS_LABELS, type AppointmentStatus } from "../types/entities";

function appointmentStatusTone(status: AppointmentStatus): "appointments" | "danger" | "muted" {
  if (status === "annule" || status === "absent") {
    return "danger";
  }
  if (status === "termine" || status === "en_cours" || status === "confirme") {
    return "appointments";
  }
  return "muted";
}

export function DashboardPage() {
  const patientsQuery = useEntityList("Patient");
  const appointmentsQuery = useEntityList("Appointment");
  const postsQuery = useEntityList("SocialPost");
  const tvQuery = useEntityList("TVContent");
  const queueQuery = useEntityList("WaitingQueueTicket");
  const flowQuery = useEntityList("PatientFlowEvent");
  const lanQuery = useEntityList("LanDevice");

  const updateAppointment = useEntityUpdate("Appointment");

  const patients = patientsQuery.data ?? [];
  const appointments = appointmentsQuery.data ?? [];
  const socialPosts = postsQuery.data ?? [];
  const tvContents = tvQuery.data ?? [];
  const queueTickets = queueQuery.data ?? [];
  const flowEvents = flowQuery.data ?? [];
  const lanDevices = lanQuery.data ?? [];

  const today = format(new Date(), "yyyy-MM-dd");
  const todayLabel = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });

  const todayAppointments = appointments
    .filter((item) => item.date === today)
    .sort((a, b) => a.heure.localeCompare(b.heure));

  const socialEngagement = socialPosts.reduce(
    (sum, post) => sum + post.metrics.likes + post.metrics.commentaires + post.metrics.partages,
    0
  );

  const activeTvContents = tvContents.filter((content) => content.actif).length;
  const queueActive = queueTickets.filter((ticket) => ticket.statut === "en_attente" || ticket.statut === "appele" || ticket.statut === "en_consultation").length;
  const flowToday = flowEvents.filter((event) => event.occuredAt.startsWith(today)).length;
  const onlineDevices = lanDevices.filter((device) => device.statut === "online").length;

  async function changeStatus(id: string, statut: AppointmentStatus) {
    await updateAppointment.mutateAsync({ id, patch: { statut } });
  }

  return (
    <div className="space-y-5">
      <header className="app-card p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Tableau de bord</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Pilotage du cabinet</h1>
        <p className="mt-1 text-sm text-slate-600">Aujourd'hui: {todayLabel}</p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} title="Total patients" value={patients.length} trend={6.2} color="patients" />
        <StatCard icon={CalendarCheck2} title="RDV du jour" value={todayAppointments.length} trend={3.8} color="appointments" />
        <StatCard icon={WandSparkles} title="Engagement social" value={socialEngagement} trend={12.4} color="social" />
        <StatCard icon={MonitorPlay} title="Contenus TV actifs" value={activeTvContents} trend={2.1} color="tv" />
        <StatCard icon={ShieldCheck} title="Flux tracés aujourd'hui" value={flowToday} trend={4.1} color="social" />
        <StatCard icon={Wifi} title={`Équipements LAN online / ${lanDevices.length || 0}`} value={onlineDevices} trend={1.7} color="appointments" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[2fr,1fr]">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Rendez-vous du jour</h2>
            <div className="flex items-center gap-2">
              <Badge tone="appointments">{todayAppointments.length} planifiés</Badge>
              <Badge tone="tv">Queue active: {queueActive}</Badge>
            </div>
          </div>

          {todayAppointments.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun rendez-vous aujourd'hui.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Heure</th>
                    <th>Type</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAppointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="font-semibold text-slate-900">{appointment.heure}</td>
                      <td className="capitalize">{appointment.type.replace("_", " ")}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Badge tone={appointmentStatusTone(appointment.statut)}>
                            {APPOINTMENT_STATUS_LABELS[appointment.statut]}
                          </Badge>
                          <Select
                            className="h-8 min-w-[130px]"
                            value={appointment.statut}
                            onChange={(event) => changeStatus(appointment.id, event.target.value as AppointmentStatus)}
                          >
                            {Object.entries(APPOINTMENT_STATUS_LABELS).map(([status, label]) => (
                              <option key={status} value={status}>
                                {label}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-base font-semibold">Actions rapides</h2>
          <div className="grid gap-2">
            <Link className="inline-flex items-center gap-2 rounded-lg bg-patients px-3 py-2 text-sm font-medium text-white" to="/patients">
              <Plus className="h-4 w-4" />
              Nouveau patient
            </Link>
            <Link className="inline-flex items-center gap-2 rounded-lg bg-appointments px-3 py-2 text-sm font-medium text-white" to="/appointments">
              <Plus className="h-4 w-4" />
              Nouveau rendez-vous
            </Link>
            <Link className="inline-flex items-center gap-2 rounded-lg bg-social px-3 py-2 text-sm font-medium text-white" to="/social-media">
              <Plus className="h-4 w-4" />
              Nouveau post
            </Link>
            <Link className="inline-flex items-center gap-2 rounded-lg bg-tv px-3 py-2 text-sm font-medium text-white" to="/tv-manager">
              <Plus className="h-4 w-4" />
              Nouveau contenu TV
            </Link>
            <Link className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white" to="/traceability">
              <Plus className="h-4 w-4" />
              Ouvrir traçabilité
            </Link>
            <Link className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white" to="/lan-devices">
              <Plus className="h-4 w-4" />
              Ouvrir LAN équipements
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
