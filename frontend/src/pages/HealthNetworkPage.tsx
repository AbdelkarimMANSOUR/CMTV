import { Link2, Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { useEntityCreate, useEntityDelete, useEntityList, useEntityUpdate } from "../hooks/useEntities";
import type { HealthNetworkLink, HealthNetworkStatus } from "../types/entities";

type HealthLinkInput = Omit<HealthNetworkLink, "id" | "createdAt" | "updatedAt">;

const defaultForm: HealthLinkInput = {
  nom: "",
  endpoint: "",
  protocol: "REST",
  statut: "connecte",
  lastSyncAt: new Date().toISOString(),
  tokenMasked: "",
  scope: ""
};

function statusTone(status: HealthNetworkStatus): "appointments" | "danger" | "tv" {
  if (status === "connecte") {
    return "appointments";
  }
  if (status === "degrade") {
    return "tv";
  }
  return "danger";
}

export function HealthNetworkPage() {
  const links = useEntityList("HealthNetworkLink").data ?? [];
  const createLink = useEntityCreate("HealthNetworkLink");
  const updateLink = useEntityUpdate("HealthNetworkLink");
  const deleteLink = useEntityDelete("HealthNetworkLink");

  const [editingLink, setEditingLink] = useState<HealthNetworkLink | null>(null);
  const [form, setForm] = useState<HealthLinkInput>(defaultForm);

  useEffect(() => {
    if (!editingLink) {
      setForm(defaultForm);
      return;
    }

    setForm({
      nom: editingLink.nom,
      endpoint: editingLink.endpoint,
      protocol: editingLink.protocol,
      statut: editingLink.statut,
      lastSyncAt: editingLink.lastSyncAt,
      tokenMasked: editingLink.tokenMasked,
      scope: editingLink.scope
    });
  }, [editingLink]);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingLink) {
      await updateLink.mutateAsync({ id: editingLink.id, patch: form });
      setEditingLink(null);
      return;
    }

    await createLink.mutateAsync(form);
    setForm(defaultForm);
  }

  async function syncNow(link: HealthNetworkLink) {
    await updateLink.mutateAsync({
      id: link.id,
      patch: {
        statut: "connecte",
        lastSyncAt: new Date().toISOString()
      }
    });
  }

  return (
    <div className="space-y-5">
      <header className="app-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Réseaux de santé</p>
          <h1 className="text-2xl font-bold text-slate-900">Systèmes connectés</h1>
        </div>
        <Badge tone="social">{links.length} liaison(s)</Badge>
      </header>

      <Card className="p-4">
        <h2 className="mb-3 text-base font-semibold">{editingLink ? "Modifier liaison" : "Nouvelle liaison"}</h2>

        <form className="grid gap-3" onSubmit={submitForm}>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="label-text">Nom</label>
              <Input value={form.nom} required onChange={(event) => setForm((prev) => ({ ...prev, nom: event.target.value }))} />
            </div>
            <div>
              <label className="label-text">Endpoint</label>
              <Input value={form.endpoint} required onChange={(event) => setForm((prev) => ({ ...prev, endpoint: event.target.value }))} />
            </div>
            <div>
              <label className="label-text">Protocole</label>
              <Input value={form.protocol} onChange={(event) => setForm((prev) => ({ ...prev, protocol: event.target.value }))} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="label-text">Statut</label>
              <Select value={form.statut} onChange={(event) => setForm((prev) => ({ ...prev, statut: event.target.value as HealthNetworkStatus }))}>
                <option value="connecte">Connecté</option>
                <option value="degrade">Dégradé</option>
                <option value="deconnecte">Déconnecté</option>
              </Select>
            </div>
            <div>
              <label className="label-text">Token masqué</label>
              <Input value={form.tokenMasked} onChange={(event) => setForm((prev) => ({ ...prev, tokenMasked: event.target.value }))} />
            </div>
            <div>
              <label className="label-text">Scope</label>
              <Input value={form.scope} onChange={(event) => setForm((prev) => ({ ...prev, scope: event.target.value }))} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={createLink.isPending || updateLink.isPending}>
              <Plus className="h-4 w-4" />
              {editingLink ? "Mettre à jour" : "Ajouter"}
            </Button>
            {editingLink ? <Button type="button" variant="outline" onClick={() => setEditingLink(null)}>Annuler édition</Button> : null}
          </div>
        </form>
      </Card>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {links.map((link) => (
          <Card key={link.id} className="p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{link.nom}</h2>
                <p className="inline-flex items-center gap-1 text-xs text-slate-500"><Link2 className="h-3.5 w-3.5" /> {link.endpoint}</p>
              </div>
              <Badge tone={statusTone(link.statut)}>{link.statut}</Badge>
            </div>

            <div className="space-y-1 text-sm text-slate-600">
              <p>Protocol: {link.protocol}</p>
              <p>Scope: {link.scope || "-"}</p>
              <p>Token: {link.tokenMasked || "-"}</p>
              <p>Dernière sync: {new Date(link.lastSyncAt).toLocaleString()}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void syncNow(link)}>
                <RefreshCcw className="h-4 w-4" />
                Sync now
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingLink(link)}>
                <Pencil className="h-4 w-4" />
                Modifier
              </Button>
              <Button size="sm" variant="danger" onClick={() => void deleteLink.mutateAsync(link.id)}>
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
