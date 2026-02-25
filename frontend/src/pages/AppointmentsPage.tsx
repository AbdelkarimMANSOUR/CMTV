import { CalendarDays, Plus, Rows3 } from "lucide-react";
import { addDays, endOfWeek, format, isWithinInterval, parseISO, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { useMemo, useState } from "react";
import { AppointmentFormDialog } from "../components/forms/AppointmentFormDialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { useEntityCreate, useEntityList, useEntityUpdate } from "../hooks/useEntities";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS, type Appointment, type AppointmentStatus } from "../types/entities";

type ViewMode = "jour" | "semaine";

function statusTone(status: AppointmentStatus): "appointments" | "danger" | "muted" {
  if (status === "annule" || status === "absent") {
    return "danger";
  }
  if (status === "en_cours" || status === "termine" || status === "confirme") {
    return "appointments";
  }
  return "muted";
}

export function AppointmentsPage() {
  const appointmentsQuery = useEntityList("Appointment");
  const patientsQuery = useEntityList("Patient");

  const createAppointment = useEntityCreate("Appointment");
  const updateAppointment = useEntityUpdate("Appointment");

  const [viewMode, setViewMode] = useState<ViewMode>("jour");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const appointments = appointmentsQuery.data ?? [];
  const patients = patientsQuery.data ?? [];

  const patientMap = useMemo(() => new Map(patients.map((patient) => [patient.id, patient])), [patients]);

  const filteredAppointments = useMemo(() => {
    const parsedSelectedDate = parseISO(selectedDate);

    const weekStart = startOfWeek(parsedSelectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(parsedSelectedDate, { weekStartsOn: 1 });

    return appointments
      .filter((appointment) => {
        if (viewMode === "jour") {
          return appointment.date === selectedDate;
        }

        return isWithinInterval(parseISO(appointment.date), { start: weekStart, end: weekEnd });
      })
      .sort((a, b) => `${a.date}-${a.heure}`.localeCompare(`${b.date}-${b.heure}`));
  }, [appointments, selectedDate, viewMode]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, index) => {
      const day = addDays(start, index);
      return format(day, "EEE dd/MM", { locale: fr });
    });
  }, [selectedDate]);

  async function submitForm(payload: Omit<Appointment, "id" | "createdAt" | "updatedAt">) {
    if (editingAppointment) {
      await updateAppointment.mutateAsync({ id: editingAppointment.id, patch: payload });
      return;
    }
    await createAppointment.mutateAsync(payload);
  }

  async function quickStatusChange(id: string, status: AppointmentStatus) {
    await updateAppointment.mutateAsync({ id, patch: { statut: status } });
  }

  return (
    <div className="space-y-5">
      <header className="app-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Rendez-vous</p>
          <h1 className="text-2xl font-bold text-slate-900">Planning médical</h1>
        </div>

        <Button
          onClick={() => {
            setEditingAppointment(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nouveau RDV
        </Button>
      </header>

      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[220px,260px,1fr]">
          <div>
            <label className="label-text">Date filtre</label>
            <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
          </div>

          <div>
            <label className="label-text">Vue</label>
            <div className="mt-1 flex gap-2">
              <Button variant={viewMode === "jour" ? "default" : "outline"} onClick={() => setViewMode("jour")}>Jour</Button>
              <Button variant={viewMode === "semaine" ? "default" : "outline"} onClick={() => setViewMode("semaine")}>Semaine</Button>
            </div>
          </div>

          {viewMode === "semaine" ? (
            <div>
              <label className="label-text">Période semaine</label>
              <div className="mt-1 flex flex-wrap gap-1 text-xs text-slate-600">
                {weekDays.map((day) => (
                  <span key={day} className="rounded-full bg-slate-100 px-2 py-1">
                    {day}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-2 text-sm text-slate-600">
              <CalendarDays className="h-4 w-4" />
              {format(parseISO(selectedDate), "EEEE d MMMM yyyy", { locale: fr })}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Liste des rendez-vous</h2>
          <Badge tone="appointments">{filteredAppointments.length} résultat(s)</Badge>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="inline-flex items-center gap-2 text-sm text-slate-500">
            <Rows3 className="h-4 w-4" />
            Aucun rendez-vous pour cette période.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Patient</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Durée</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => {
                  const patient = patientMap.get(appointment.patient_id);
                  return (
                    <tr key={appointment.id}>
                      <td>{appointment.date}</td>
                      <td className="font-semibold text-slate-900">{appointment.heure}</td>
                      <td>{patient ? `${patient.prenom} ${patient.nom}` : "Patient inconnu"}</td>
                      <td>
                        <Badge tone="appointments">{APPOINTMENT_TYPE_LABELS[appointment.type]}</Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Badge tone={statusTone(appointment.statut)}>{APPOINTMENT_STATUS_LABELS[appointment.statut]}</Badge>
                          <Select
                            className="h-8 min-w-[130px]"
                            value={appointment.statut}
                            onChange={(event) => quickStatusChange(appointment.id, event.target.value as AppointmentStatus)}
                          >
                            {Object.entries(APPOINTMENT_STATUS_LABELS).map(([status, label]) => (
                              <option key={status} value={status}>
                                {label}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </td>
                      <td>{appointment.duree} min</td>
                      <td>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingAppointment(appointment);
                            setDialogOpen(true);
                          }}
                        >
                          Modifier
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingAppointment}
        patients={patients}
        isPending={createAppointment.isPending || updateAppointment.isPending}
        onSubmit={submitForm}
      />
    </div>
  );
}
