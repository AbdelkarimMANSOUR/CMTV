import { CalendarRange, CheckCircle2, Mail, PhoneCall } from "lucide-react";
import { useState, type FormEvent } from "react";
import { LandingShell } from "../components/landing/LandingShell";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useEntityCreate, useEntityList } from "../hooks/useEntities";
import { useSeo } from "../hooks/useSeo";
import type { Lead } from "../types/entities";

type LeadInput = Omit<Lead, "id" | "createdAt" | "updatedAt">;

const defaultForm: LeadInput = {
  fullName: "",
  telephone: "",
  email: "",
  message: "",
  source: "landing",
  requestedDate: "",
  requestedService: "",
  status: "nouveau"
};

export function LandingBookingPage() {
  const createLead = useEntityCreate("Lead");
  const doctorProfile = useEntityList("DoctorProfile").data?.[0];
  const [form, setForm] = useState<LeadInput>(defaultForm);
  const [submitted, setSubmitted] = useState(false);

  useSeo(
    "Prise de rendez-vous | Cabinet Dr Basma Oumalloul",
    "Formulaire de prise de rendez-vous pour le cabinet Dr Basma Oumalloul à Marrakech."
  );

  async function submitLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await createLead.mutateAsync(form);
    setSubmitted(true);
    setForm(defaultForm);
  }

  return (
    <LandingShell
      title="Prendre rendez-vous"
      subtitle="Remplissez ce formulaire. Le cabinet vous contacte rapidement pour confirmer la disponibilité."
    >
      <section className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">Demande de rendez-vous</h2>
          <p className="mt-1 text-sm text-slate-600">Champs essentiels pour un traitement rapide de votre demande.</p>

          <form className="mt-4 grid gap-3" onSubmit={submitLead}>
            <div>
              <label className="label-text">Nom complet</label>
              <Input value={form.fullName} required onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="label-text">Téléphone</label>
                <Input value={form.telephone} onChange={(event) => setForm((prev) => ({ ...prev, telephone: event.target.value }))} />
              </div>
              <div>
                <label className="label-text">Email</label>
                <Input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="label-text">Date souhaitée</label>
                <Input type="date" value={form.requestedDate} onChange={(event) => setForm((prev) => ({ ...prev, requestedDate: event.target.value }))} />
              </div>
              <div>
                <label className="label-text">Service</label>
                <Input value={form.requestedService} placeholder="Suivi grossesse, échographie..." onChange={(event) => setForm((prev) => ({ ...prev, requestedService: event.target.value }))} />
              </div>
            </div>

            <div>
              <label className="label-text">Message</label>
              <Textarea value={form.message} rows={4} onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))} />
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={createLead.isPending}>Envoyer la demande</Button>
              {submitted ? (
                <p className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Demande envoyée avec succès
                </p>
              ) : null}
            </div>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900">Coordonnées cabinet</h2>
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            <p className="inline-flex items-start gap-2"><PhoneCall className="mt-0.5 h-4 w-4 text-violet-700" /> {doctorProfile?.telephone}</p>
            <p className="inline-flex items-start gap-2"><Mail className="mt-0.5 h-4 w-4 text-violet-700" /> {doctorProfile?.email}</p>
            <p className="inline-flex items-start gap-2"><CalendarRange className="mt-0.5 h-4 w-4 text-violet-700" /> {doctorProfile?.horaires}</p>
          </div>

          <div className="mt-5 rounded-xl bg-violet-50 p-4 text-sm text-violet-900">
            <p className="font-semibold">Bon à savoir</p>
            <p className="mt-1">Préparez carte d'assurance, ancien dossier médical et résultats d'examens récents.</p>
          </div>
        </Card>
      </section>
    </LandingShell>
  );
}
