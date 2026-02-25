import { Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { PatientCard } from "../components/cards/PatientCard";
import { PatientFormDialog } from "../components/forms/PatientFormDialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useEntityCreate, useEntityDelete, useEntityList, useEntityUpdate } from "../hooks/useEntities";
import type { Patient } from "../types/entities";

export function PatientsPage() {
  const patientsQuery = useEntityList("Patient");
  const createPatient = useEntityCreate("Patient");
  const updatePatient = useEntityUpdate("Patient");
  const deletePatient = useEntityDelete("Patient");

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const patients = patientsQuery.data ?? [];

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return patients;
    }

    return patients.filter((patient) => {
      const haystack = `${patient.prenom} ${patient.nom} ${patient.telephone} ${patient.email}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [patients, search]);

  async function handleSubmit(payload: Omit<Patient, "id" | "createdAt" | "updatedAt">) {
    if (selectedPatient) {
      await updatePatient.mutateAsync({ id: selectedPatient.id, patch: payload });
      return;
    }
    await createPatient.mutateAsync(payload);
  }

  async function handleDelete(id: string) {
    await deletePatient.mutateAsync(id);
  }

  return (
    <div className="space-y-5">
      <header className="app-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Patients</p>
          <h1 className="text-2xl font-bold text-slate-900">Gestion patients</h1>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="patients">{filteredPatients.length} résultat(s)</Badge>
          <Button
            onClick={() => {
              setSelectedPatient(null);
              setDialogOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Nouveau patient
          </Button>
        </div>
      </header>

      <Card className="p-4">
        <label className="label-text mb-2 block">Recherche patient</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Nom, prénom, téléphone, email" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredPatients.map((patient) => (
          <PatientCard
            key={patient.id}
            patient={patient}
            onEdit={(value) => {
              setSelectedPatient(value);
              setDialogOpen(true);
            }}
            onDelete={(id) => {
              void handleDelete(id);
            }}
          />
        ))}
      </section>

      <PatientFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={selectedPatient}
        isPending={createPatient.isPending || updatePatient.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
