import { Mail, Phone, Shield, Trash2, UserPen } from "lucide-react";
import type { Patient } from "../../types/entities";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

type PatientCardProps = {
  patient: Patient;
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
};

export function PatientCard({ patient, onEdit, onDelete }: PatientCardProps) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {patient.prenom} {patient.nom}
          </h3>
          <p className="text-xs text-slate-500">Né(e) le {patient.dateNaissance}</p>
        </div>
        <Badge tone="patients">{patient.groupeSanguin || "N/A"}</Badge>
      </div>

      <div className="space-y-1 text-sm text-slate-700">
        <p className="inline-flex items-center gap-2">
          <Phone className="h-4 w-4 text-slate-400" />
          {patient.telephone || "-"}
        </p>
        <p className="inline-flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-400" />
          {patient.email || "-"}
        </p>
        <p className="inline-flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-400" />
          Assurance: {patient.numeroAssurance || "-"}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(patient)}>
          <UserPen className="h-4 w-4" />
          Modifier
        </Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(patient.id)}>
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </div>
    </Card>
  );
}
