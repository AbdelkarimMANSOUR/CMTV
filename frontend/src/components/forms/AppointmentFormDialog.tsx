import { useEffect, useState, type FormEvent } from "react";
import type { Appointment, AppointmentStatus, AppointmentType, Patient } from "../../types/entities";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_TYPE_LABELS } from "../../types/entities";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

type AppointmentInput = Omit<Appointment, "id" | "createdAt" | "updatedAt">;

type AppointmentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Appointment | null;
  patients: Patient[];
  isPending?: boolean;
  onSubmit: (payload: AppointmentInput) => Promise<void> | void;
};

const emptyForm: AppointmentInput = {
  patient_id: "",
  date: "",
  heure: "09:00",
  duree: 30,
  type: "consultation",
  statut: "planifie",
  motif: ""
};

const appointmentTypes: AppointmentType[] = ["consultation", "suivi", "urgence", "controle", "vaccination"];
const appointmentStatuses: AppointmentStatus[] = ["planifie", "confirme", "en_cours", "termine", "annule", "absent"];

export function AppointmentFormDialog({
  open,
  onOpenChange,
  initialData,
  patients,
  isPending,
  onSubmit
}: AppointmentFormDialogProps) {
  const [form, setForm] = useState<AppointmentInput>(emptyForm);

  useEffect(() => {
    if (initialData) {
      setForm({
        patient_id: initialData.patient_id,
        date: initialData.date,
        heure: initialData.heure,
        duree: initialData.duree,
        type: initialData.type,
        statut: initialData.statut,
        motif: initialData.motif
      });
      return;
    }

    setForm({ ...emptyForm, patient_id: patients[0]?.id ?? "" });
  }, [initialData, open, patients]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(form);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader title={initialData ? "Modifier rendez-vous" : "Nouveau rendez-vous"} />

        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div>
            <label className="label-text">Patient</label>
            <Select value={form.patient_id} onChange={(e) => setForm((p) => ({ ...p, patient_id: e.target.value }))} required>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.prenom} {patient.nom}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="label-text">Date</label>
              <Input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
            </div>
            <div>
              <label className="label-text">Heure</label>
              <Input type="time" value={form.heure} onChange={(e) => setForm((p) => ({ ...p, heure: e.target.value }))} required />
            </div>
            <div>
              <label className="label-text">Durée (min)</label>
              <Input
                type="number"
                min={5}
                value={form.duree}
                onChange={(e) => setForm((p) => ({ ...p, duree: Number(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label-text">Type</label>
              <Select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as AppointmentType }))}>
                {appointmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {APPOINTMENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="label-text">Statut</label>
              <Select value={form.statut} onChange={(e) => setForm((p) => ({ ...p, statut: e.target.value as AppointmentStatus }))}>
                {appointmentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {APPOINTMENT_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="label-text">Motif</label>
            <Input value={form.motif} onChange={(e) => setForm((p) => ({ ...p, motif: e.target.value }))} placeholder="Consultation de contrôle" />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {initialData ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
