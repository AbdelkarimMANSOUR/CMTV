import { Building2, Pencil, Plus, Trash2, UserCog } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { useEntityCreate, useEntityDelete, useEntityList, useEntityUpdate } from "../hooks/useEntities";
import { RESOURCE_STATUS_LABELS, type Resource, type ResourceStatus, type ResourceType } from "../types/entities";

type ResourceInput = Omit<Resource, "id" | "createdAt" | "updatedAt">;

const defaultForm: ResourceInput = {
  nom: "",
  type: "personnel",
  statut: "disponible",
  capacite: 1,
  planning: "",
  notes: ""
};

function statusTone(status: ResourceStatus): "appointments" | "danger" | "tv" | "muted" | "social" {
  if (status === "hors_service") {
    return "danger";
  }
  if (status === "occupe") {
    return "tv";
  }
  if (status === "maintenance") {
    return "social";
  }
  return "appointments";
}

export function ResourcesPage() {
  const resources = useEntityList("Resource").data ?? [];
  const createResource = useEntityCreate("Resource");
  const updateResource = useEntityUpdate("Resource");
  const deleteResource = useEntityDelete("Resource");

  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [form, setForm] = useState<ResourceInput>(defaultForm);

  useEffect(() => {
    if (!editingResource) {
      setForm(defaultForm);
      return;
    }

    setForm({
      nom: editingResource.nom,
      type: editingResource.type,
      statut: editingResource.statut,
      capacite: editingResource.capacite,
      planning: editingResource.planning,
      notes: editingResource.notes
    });
  }, [editingResource]);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingResource) {
      await updateResource.mutateAsync({ id: editingResource.id, patch: form });
      setEditingResource(null);
      return;
    }

    await createResource.mutateAsync(form);
    setForm(defaultForm);
  }

  return (
    <div className="space-y-5">
      <header className="app-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Gestion intelligente</p>
          <h1 className="text-2xl font-bold text-slate-900">Ressources du cabinet</h1>
        </div>
        <Badge tone="appointments">{resources.length} ressource(s)</Badge>
      </header>

      <Card className="p-4">
        <h2 className="mb-3 text-base font-semibold">{editingResource ? "Modifier ressource" : "Nouvelle ressource"}</h2>

        <form className="grid gap-3" onSubmit={submitForm}>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="label-text">Nom</label>
              <Input value={form.nom} required onChange={(event) => setForm((prev) => ({ ...prev, nom: event.target.value }))} />
            </div>
            <div>
              <label className="label-text">Type</label>
              <Select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as ResourceType }))}>
                <option value="personnel">Personnel</option>
                <option value="salle">Salle</option>
                <option value="equipement">Équipement</option>
              </Select>
            </div>
            <div>
              <label className="label-text">Statut</label>
              <Select value={form.statut} onChange={(event) => setForm((prev) => ({ ...prev, statut: event.target.value as ResourceStatus }))}>
                <option value="disponible">Disponible</option>
                <option value="occupe">Occupé</option>
                <option value="maintenance">Maintenance</option>
                <option value="hors_service">Hors service</option>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label-text">Capacité</label>
              <Input type="number" min={1} value={form.capacite} onChange={(event) => setForm((prev) => ({ ...prev, capacite: Number(event.target.value) }))} />
            </div>
            <div>
              <label className="label-text">Planning</label>
              <Input value={form.planning} onChange={(event) => setForm((prev) => ({ ...prev, planning: event.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label-text">Notes</label>
            <Textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={createResource.isPending || updateResource.isPending}>
              <Plus className="h-4 w-4" />
              {editingResource ? "Mettre à jour" : "Ajouter"}
            </Button>
            {editingResource ? (
              <Button type="button" variant="outline" onClick={() => setEditingResource(null)}>
                Annuler édition
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource.id} className="p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{resource.nom}</h2>
                <p className="text-xs text-slate-500">{resource.type}</p>
              </div>
              <Badge tone={statusTone(resource.statut)}>{RESOURCE_STATUS_LABELS[resource.statut]}</Badge>
            </div>

            <div className="space-y-1 text-sm text-slate-600">
              <p className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Capacité: {resource.capacite}</p>
              <p className="inline-flex items-center gap-1"><UserCog className="h-3.5 w-3.5" /> Planning: {resource.planning || "-"}</p>
              <p>{resource.notes || "Aucune note"}</p>
            </div>

            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditingResource(resource)}>
                <Pencil className="h-4 w-4" />
                Modifier
              </Button>
              <Button size="sm" variant="danger" onClick={() => void deleteResource.mutateAsync(resource.id)}>
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
