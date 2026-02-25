import { Camera, MonitorSmartphone, Pencil, Plus, Printer, ScanLine, Server, Trash2, Wifi } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { useEntityCreate, useEntityDelete, useEntityList, useEntityUpdate } from "../hooks/useEntities";
import {
  LAN_DEVICE_STATUS_LABELS,
  type LanAuthMode,
  type LanDevice,
  type LanDeviceStatus,
  type LanDeviceType
} from "../types/entities";

type LanDeviceInput = Omit<LanDevice, "id" | "createdAt" | "updatedAt">;

const defaultForm: LanDeviceInput = {
  nom: "",
  type: "imprimante",
  ipAdresse: "",
  macAdresse: "",
  statut: "online",
  authMode: "local_token",
  authSecretMasked: "",
  capabilities: [],
  streamUrl: "",
  lastSeenAt: new Date().toISOString(),
  notes: ""
};

function statusTone(status: LanDeviceStatus): "appointments" | "danger" | "tv" {
  if (status === "offline") {
    return "danger";
  }
  if (status === "alerte") {
    return "tv";
  }
  return "appointments";
}

function typeIcon(type: LanDeviceType) {
  if (type === "imprimante") {
    return Printer;
  }
  if (type === "scanner") {
    return ScanLine;
  }
  if (type === "camera_ip") {
    return Camera;
  }
  if (type === "routeur") {
    return Wifi;
  }
  return MonitorSmartphone;
}

export function LanDevicesPage() {
  const devices = useEntityList("LanDevice").data ?? [];
  const createDevice = useEntityCreate("LanDevice");
  const updateDevice = useEntityUpdate("LanDevice");
  const deleteDevice = useEntityDelete("LanDevice");
  const createAudit = useEntityCreate("AuditLog");

  const [editingDevice, setEditingDevice] = useState<LanDevice | null>(null);
  const [form, setForm] = useState<LanDeviceInput>(defaultForm);
  const [capabilitiesText, setCapabilitiesText] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    if (!editingDevice) {
      setForm(defaultForm);
      setCapabilitiesText("");
      return;
    }

    setForm({
      nom: editingDevice.nom,
      type: editingDevice.type,
      ipAdresse: editingDevice.ipAdresse,
      macAdresse: editingDevice.macAdresse,
      statut: editingDevice.statut,
      authMode: editingDevice.authMode,
      authSecretMasked: editingDevice.authSecretMasked,
      capabilities: editingDevice.capabilities,
      streamUrl: editingDevice.streamUrl,
      lastSeenAt: editingDevice.lastSeenAt,
      notes: editingDevice.notes
    });
    setCapabilitiesText(editingDevice.capabilities.join(", "));
  }, [editingDevice]);

  const onlineStats = useMemo(() => {
    const online = devices.filter((device) => device.statut === "online").length;
    return `${online}/${devices.length || 0}`;
  }, [devices]);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: LanDeviceInput = {
      ...form,
      capabilities: capabilitiesText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      lastSeenAt: form.lastSeenAt || new Date().toISOString()
    };

    if (editingDevice) {
      await updateDevice.mutateAsync({ id: editingDevice.id, patch: payload });
      setEditingDevice(null);
      return;
    }

    await createDevice.mutateAsync(payload);
    setForm(defaultForm);
    setCapabilitiesText("");
  }

  async function runDeviceAction(device: LanDevice, actionLabel: string) {
    const now = new Date().toISOString();

    await updateDevice.mutateAsync({
      id: device.id,
      patch: {
        statut: "online",
        lastSeenAt: now
      }
    });

    await createAudit.mutateAsync({
      entity: "LanDevice",
      entityId: device.id,
      action: "manual",
      actor: "network-admin",
      timestamp: now,
      changesSummary: `${actionLabel} exécuté sur ${device.nom}`,
      before: null,
      after: { action: actionLabel, result: "ok" },
      complianceTag: "Interne"
    });

    setActionMessage(`${actionLabel} OK: ${device.nom}`);
    window.setTimeout(() => setActionMessage(""), 2500);
  }

  return (
    <div className="space-y-5">
      <header className="app-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Intégration LAN</p>
          <h1 className="text-2xl font-bold text-slate-900">Équipements réseau</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="appointments">Online: {onlineStats}</Badge>
          {actionMessage ? <Badge tone="tv">{actionMessage}</Badge> : null}
        </div>
      </header>

      <Card className="p-4">
        <h2 className="mb-3 text-base font-semibold">{editingDevice ? "Modifier appareil" : "Nouvel appareil"}</h2>

        <form className="grid gap-3" onSubmit={submitForm}>
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="label-text">Nom</label>
              <Input value={form.nom} required onChange={(event) => setForm((prev) => ({ ...prev, nom: event.target.value }))} />
            </div>
            <div>
              <label className="label-text">Type</label>
              <Select value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as LanDeviceType }))}>
                <option value="imprimante">Imprimante</option>
                <option value="scanner">Scanner</option>
                <option value="camera_ip">Caméra IP</option>
                <option value="routeur">Routeur</option>
                <option value="autre">Autre</option>
              </Select>
            </div>
            <div>
              <label className="label-text">IP</label>
              <Input value={form.ipAdresse} onChange={(event) => setForm((prev) => ({ ...prev, ipAdresse: event.target.value }))} placeholder="192.168.1.10" />
            </div>
            <div>
              <label className="label-text">MAC</label>
              <Input value={form.macAdresse} onChange={(event) => setForm((prev) => ({ ...prev, macAdresse: event.target.value }))} placeholder="00:AA:BB:CC:DD:EE" />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="label-text">Statut</label>
              <Select value={form.statut} onChange={(event) => setForm((prev) => ({ ...prev, statut: event.target.value as LanDeviceStatus }))}>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="alerte">Alerte</option>
              </Select>
            </div>
            <div>
              <label className="label-text">Auth</label>
              <Select value={form.authMode} onChange={(event) => setForm((prev) => ({ ...prev, authMode: event.target.value as LanAuthMode }))}>
                <option value="local_token">Token local</option>
                <option value="api_key">API key</option>
                <option value="oauth2">OAuth2</option>
              </Select>
            </div>
            <div>
              <label className="label-text">Secret masqué</label>
              <Input value={form.authSecretMasked} onChange={(event) => setForm((prev) => ({ ...prev, authSecretMasked: event.target.value }))} placeholder="tok_****" />
            </div>
            <div>
              <label className="label-text">Dernier heartbeat</label>
              <Input value={form.lastSeenAt} onChange={(event) => setForm((prev) => ({ ...prev, lastSeenAt: event.target.value }))} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label-text">Capacités (séparées par virgule)</label>
              <Input value={capabilitiesText} onChange={(event) => setCapabilitiesText(event.target.value)} placeholder="print_a4, scan_pdf, rtsp_stream" />
            </div>
            <div>
              <label className="label-text">URL stream (caméra)</label>
              <Input value={form.streamUrl} onChange={(event) => setForm((prev) => ({ ...prev, streamUrl: event.target.value }))} placeholder="https://.../camera.mp4" />
            </div>
          </div>

          <div>
            <label className="label-text">Notes</label>
            <Textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={createDevice.isPending || updateDevice.isPending}>
              <Plus className="h-4 w-4" />
              {editingDevice ? "Mettre à jour" : "Ajouter"}
            </Button>
            {editingDevice ? (
              <Button type="button" variant="outline" onClick={() => setEditingDevice(null)}>
                Annuler édition
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {devices.map((device) => {
          const Icon = typeIcon(device.type);
          return (
            <Card key={device.id} className="p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2">
                  <span className="rounded-lg bg-slate-100 p-2 text-slate-700"><Icon className="h-4 w-4" /></span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{device.nom}</h2>
                    <p className="text-xs text-slate-500">{device.type} • {device.ipAdresse}</p>
                  </div>
                </div>
                <Badge tone={statusTone(device.statut)}>{LAN_DEVICE_STATUS_LABELS[device.statut]}</Badge>
              </div>

              <div className="space-y-1 text-sm text-slate-600">
                <p className="inline-flex items-center gap-1"><Server className="h-3.5 w-3.5" /> Auth: {device.authMode}</p>
                <p className="inline-flex items-center gap-1"><Wifi className="h-3.5 w-3.5" /> Last seen: {new Date(device.lastSeenAt).toLocaleString()}</p>
                <p>Capabilities: {device.capabilities.join(", ") || "-"}</p>
                <p>{device.notes || "-"}</p>
              </div>

              {device.type === "camera_ip" && device.streamUrl ? (
                <video src={device.streamUrl} className="mt-3 h-36 w-full rounded-lg bg-slate-950 object-cover" controls muted />
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => void runDeviceAction(device, "Ping réseau")}>Ping</Button>
                {device.type === "imprimante" ? (
                  <Button size="sm" onClick={() => void runDeviceAction(device, "Test impression")}>Test impression</Button>
                ) : null}
                {device.type === "scanner" ? (
                  <Button size="sm" onClick={() => void runDeviceAction(device, "Test scan")}>Test scan</Button>
                ) : null}
                {device.type === "camera_ip" ? (
                  <Button size="sm" onClick={() => void runDeviceAction(device, "Test stream caméra")}>Test caméra</Button>
                ) : null}
              </div>

              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditingDevice(device)}>
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Button>
                <Button size="sm" variant="danger" onClick={() => void deleteDevice.mutateAsync(device.id)}>
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
