import { useEffect, useState, type FormEvent } from "react";
import type { Patient } from "../../types/entities";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type PatientInput = Omit<Patient, "id" | "createdAt" | "updatedAt">;

type PatientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Patient | null;
  isPending?: boolean;
  onSubmit: (payload: PatientInput) => Promise<void> | void;
};

const emptyPatient: PatientInput = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  genre: "femme",
  telephone: "",
  email: "",
  adresse: "",
  groupeSanguin: "",
  allergies: [],
  notes: "",
  numeroAssurance: "",
  contactUrgence: {
    name: "",
    phone: "",
    relation: ""
  }
};

export function PatientFormDialog({ open, onOpenChange, initialData, isPending, onSubmit }: PatientFormDialogProps) {
  const [form, setForm] = useState<PatientInput>(emptyPatient);
  const [allergiesInput, setAllergiesInput] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        nom: initialData.nom,
        prenom: initialData.prenom,
        dateNaissance: initialData.dateNaissance,
        genre: initialData.genre,
        telephone: initialData.telephone,
        email: initialData.email,
        adresse: initialData.adresse,
        groupeSanguin: initialData.groupeSanguin,
        allergies: initialData.allergies,
        notes: initialData.notes,
        numeroAssurance: initialData.numeroAssurance,
        contactUrgence: initialData.contactUrgence
      });
      setAllergiesInput(initialData.allergies.join(", "));
      return;
    }

    setForm(emptyPatient);
    setAllergiesInput("");
  }, [initialData, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: PatientInput = {
      ...form,
      allergies: allergiesInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    };

    await onSubmit(payload);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader
          title={initialData ? "Modifier patient" : "Nouveau patient"}
          description="Informations administratives et médicales"
        />

        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label-text">Nom</label>
              <Input value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} required />
            </div>
            <div>
              <label className="label-text">Prénom</label>
              <Input value={form.prenom} onChange={(e) => setForm((p) => ({ ...p, prenom: e.target.value }))} required />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="label-text">Date naissance</label>
              <Input type="date" value={form.dateNaissance} onChange={(e) => setForm((p) => ({ ...p, dateNaissance: e.target.value }))} required />
            </div>
            <div>
              <label className="label-text">Genre</label>
              <select className="input-base" value={form.genre} onChange={(e) => setForm((p) => ({ ...p, genre: e.target.value as PatientInput["genre"] }))}>
                <option value="femme">Femme</option>
                <option value="homme">Homme</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="label-text">Groupe sanguin</label>
              <Input value={form.groupeSanguin} onChange={(e) => setForm((p) => ({ ...p, groupeSanguin: e.target.value }))} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label-text">Téléphone</label>
              <Input value={form.telephone} onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))} />
            </div>
            <div>
              <label className="label-text">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label-text">Adresse</label>
            <Input value={form.adresse} onChange={(e) => setForm((p) => ({ ...p, adresse: e.target.value }))} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label-text">N° assurance</label>
              <Input value={form.numeroAssurance} onChange={(e) => setForm((p) => ({ ...p, numeroAssurance: e.target.value }))} />
            </div>
            <div>
              <label className="label-text">Allergies (séparées par virgule)</label>
              <Input value={allergiesInput} onChange={(e) => setAllergiesInput(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="label-text">Contact urgence - nom</label>
              <Input
                value={form.contactUrgence.name}
                onChange={(e) => setForm((p) => ({ ...p, contactUrgence: { ...p.contactUrgence, name: e.target.value } }))}
              />
            </div>
            <div>
              <label className="label-text">Contact urgence - téléphone</label>
              <Input
                value={form.contactUrgence.phone}
                onChange={(e) => setForm((p) => ({ ...p, contactUrgence: { ...p.contactUrgence, phone: e.target.value } }))}
              />
            </div>
            <div>
              <label className="label-text">Relation</label>
              <Input
                value={form.contactUrgence.relation}
                onChange={(e) => setForm((p) => ({ ...p, contactUrgence: { ...p.contactUrgence, relation: e.target.value } }))}
              />
            </div>
          </div>

          <div>
            <label className="label-text">Notes</label>
            <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>

          <div className="mt-1 flex justify-end gap-2">
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
