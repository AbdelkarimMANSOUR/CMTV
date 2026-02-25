import {
  AudioLines,
  BellRing,
  CheckCircle2,
  Clapperboard,
  Download,
  ExternalLink,
  LoaderCircle,
  MonitorPlay,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Trash2,
  UserRoundX,
  UsersRound
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { addDays, format, parseISO, isWithinInterval } from "date-fns";
import { TVContentFormDialog } from "../components/forms/TVContentFormDialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { useEntityCreate, useEntityDelete, useEntityList, useEntityUpdate } from "../hooks/useEntities";
import { useResolvedMediaUrl } from "../hooks/useResolvedMediaUrl";
import { base44 } from "../lib/base44";
import { downloadMediaReference, isLocalMediaRef } from "../lib/localMediaStore";
import { resolveTVMediaSrc } from "../lib/tvMedia";
import { triggerTVSync } from "../lib/tvSync";
import {
  QUEUE_PRIORITY_LABELS,
  QUEUE_STATUS_LABELS,
  TV_TYPE_LABELS,
  type QueueTicketPriority,
  type QueueTicketStatus,
  type TVAudioTrack,
  type TVContent,
  type TVTargetScreen,
  type WaitingQueueTicket
} from "../types/entities";

function queueStatusTone(status: QueueTicketStatus): "appointments" | "danger" | "tv" | "muted" {
  if (status === "absent") {
    return "danger";
  }
  if (status === "appele") {
    return "tv";
  }
  if (status === "en_consultation" || status === "termine") {
    return "appointments";
  }
  return "muted";
}

function buildTicketNumber(existing: WaitingQueueTicket[], priority: QueueTicketPriority): string {
  const prefix = priority === "urgence" ? "U" : priority === "prioritaire" ? "P" : "A";
  const maxValue = existing
    .map((item) => item.numeroTicket)
    .filter((value) => value.startsWith(`${prefix}-`))
    .map((value) => Number.parseInt(value.split("-")[1] ?? "0", 10))
    .reduce((max, current) => (Number.isFinite(current) ? Math.max(max, current) : max), 0);

  return `${prefix}-${String(maxValue + 1).padStart(3, "0")}`;
}

function nextAudioOrder(existing: TVAudioTrack[]): number {
  return Math.max(...existing.map((item) => item.ordre), 0) + 1;
}

function TVContentMediaThumb({ content }: { content: TVContent }) {
  const src = useResolvedMediaUrl(content.media, content.type, content.titre);
  const localStored = isLocalMediaRef(content.media);

  if ((content.type !== "image" && content.type !== "video") || !content.media.trim()) {
    return null;
  }

  if (!src) {
    return <p className="mt-2 text-xs font-semibold text-amber-600">Média local introuvable</p>;
  }

  return (
    <div className="mt-2">
      {content.type === "image" ? (
        <img
          src={src}
          alt={content.titre}
          className="h-8 w-8 rounded border border-slate-200 object-contain"
        />
      ) : (
        <video
          src={src}
          className="h-12 w-20 rounded border border-slate-200 bg-slate-950 object-cover"
          muted
          preload="metadata"
        />
      )}
      {localStored ? <p className="mt-1 text-[11px] font-medium text-slate-500">Stocké local</p> : null}
    </div>
  );
}

export function TVManagerPage() {
  const tvQuery = useEntityList("TVContent");
  const audioQuery = useEntityList("TVAudioTrack");
  const queueQuery = useEntityList("WaitingQueueTicket");
  const patientsQuery = useEntityList("Patient");
  const appointmentsQuery = useEntityList("Appointment");

  const createContent = useEntityCreate("TVContent");
  const updateContent = useEntityUpdate("TVContent");
  const deleteContent = useEntityDelete("TVContent");

  const createAudio = useEntityCreate("TVAudioTrack");
  const updateAudio = useEntityUpdate("TVAudioTrack");
  const deleteAudio = useEntityDelete("TVAudioTrack");

  const createTicket = useEntityCreate("WaitingQueueTicket");
  const updateTicket = useEntityUpdate("WaitingQueueTicket");
  const deleteTicket = useEntityDelete("WaitingQueueTicket");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<TVContent | null>(null);
  const [screenFilter, setScreenFilter] = useState<TVTargetScreen | "all">("all");

  const [queuePatientId, setQueuePatientId] = useState("");
  const [queuePriority, setQueuePriority] = useState<QueueTicketPriority>("normale");
  const [queueScreen, setQueueScreen] = useState<TVTargetScreen>("salle_attente");

  const [selectedAudio, setSelectedAudio] = useState<TVAudioTrack | null>(null);
  const [audioTitre, setAudioTitre] = useState("");
  const [audioArtiste, setAudioArtiste] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioOrdre, setAudioOrdre] = useState(1);
  const [audioScreen, setAudioScreen] = useState<TVTargetScreen>("salle_attente");
  const [audioActif, setAudioActif] = useState(true);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioUploadError, setAudioUploadError] = useState("");
  const [audioFormFeedback, setAudioFormFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const audioFormRef = useRef<HTMLFormElement | null>(null);
  const [tvSyncing, setTvSyncing] = useState(false);
  const [tvSyncFeedback, setTvSyncFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [mediaTransferFeedback, setMediaTransferFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const contents = tvQuery.data ?? [];
  const audioTracks = audioQuery.data ?? [];
  const queueTickets = queueQuery.data ?? [];
  const patients = patientsQuery.data ?? [];
  const appointments = appointmentsQuery.data ?? [];

  useEffect(() => {
    if (selectedAudio) {
      setAudioTitre(selectedAudio.titre);
      setAudioArtiste(selectedAudio.artiste);
      setAudioUrl(selectedAudio.url);
      setAudioOrdre(selectedAudio.ordre);
      setAudioScreen(selectedAudio.ecranCible);
      setAudioActif(selectedAudio.actif);
      return;
    }

    setAudioTitre("");
    setAudioArtiste("");
    setAudioUrl("");
    setAudioOrdre(nextAudioOrder(audioTracks));
    setAudioScreen("salle_attente");
    setAudioActif(true);
  }, [selectedAudio, audioTracks]);

  const patientMap = useMemo(() => new Map(patients.map((patient) => [patient.id, patient])), [patients]);

  const filteredContents = useMemo(() => {
    return contents
      .filter((content) => {
        if (screenFilter === "all") {
          return true;
        }
        return content.ecranCible === screenFilter || content.ecranCible === "toutes";
      })
      .sort((a, b) => a.ordre - b.ordre);
  }, [contents, screenFilter]);

  const filteredAudioTracks = useMemo(() => {
    return audioTracks
      .filter((track) => {
        if (screenFilter === "all") {
          return true;
        }
        return track.ecranCible === screenFilter || track.ecranCible === "toutes";
      })
      .sort((a, b) => a.ordre - b.ordre);
  }, [audioTracks, screenFilter]);

  const filteredQueue = useMemo(() => {
    return queueTickets
      .filter((ticket) => {
        if (screenFilter === "all") {
          return true;
        }
        return ticket.ecranCible === screenFilter || ticket.ecranCible === "toutes";
      })
      .sort((a, b) => {
        const priorityOrder: Record<QueueTicketPriority, number> = {
          urgence: 0,
          prioritaire: 1,
          normale: 2
        };

        if (a.statut === "en_attente" && b.statut === "en_attente") {
          if (priorityOrder[a.priorite] !== priorityOrder[b.priorite]) {
            return priorityOrder[a.priorite] - priorityOrder[b.priorite];
          }
        }

        return a.heureArrivee.localeCompare(b.heureArrivee);
      });
  }, [queueTickets, screenFilter]);

  function resetAudioForm() {
    setSelectedAudio(null);
    setAudioUploadError("");
    setAudioFormFeedback(null);
  }

  function startEditingAudio(track: TVAudioTrack) {
    setSelectedAudio(track);
    setAudioUploadError("");
    setAudioFormFeedback(null);
    audioFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function submitForm(payload: Omit<TVContent, "id" | "createdAt" | "updatedAt">) {
    if (selectedContent) {
      await updateContent.mutateAsync({ id: selectedContent.id, patch: payload });
      return;
    }
    await createContent.mutateAsync(payload);
  }

  async function toggleActive(content: TVContent) {
    await updateContent.mutateAsync({ id: content.id, patch: { actif: !content.actif } });
  }

  async function publishNow(content: TVContent) {
    const today = new Date();
    await updateContent.mutateAsync({
      id: content.id,
      patch: {
        actif: true,
        dateDebut: format(today, "yyyy-MM-dd"),
        dateFin: format(addDays(today, 30), "yyyy-MM-dd")
      }
    });
  }

  async function addWebTestVideo() {
    const today = new Date();
    await createContent.mutateAsync({
      titre: "Vidéo de test",
      type: "video",
      dureeAffichage: 20,
      ordre: Math.max(...contents.map((item) => item.ordre), 0) + 1,
      ecranCible: "salle_attente",
      dateDebut: format(today, "yyyy-MM-dd"),
      dateFin: format(addDays(today, 30), "yyyy-MM-dd"),
      couleurFond: "#0f172a",
      media: "/media/demo-test.mp4",
      message: "Lecture vidéo de démonstration",
      actif: true
    });
  }

  function isBroadcastingNow(content: TVContent): boolean {
    if (!content.actif) {
      return false;
    }
    if (!content.dateDebut || !content.dateFin) {
      return true;
    }
    const now = new Date();
    return isWithinInterval(now, { start: parseISO(content.dateDebut), end: parseISO(content.dateFin) });
  }

  async function createQueueTicket() {
    if (!queuePatientId) {
      return;
    }

    const nowIso = new Date().toISOString();
    const futureAppointment = appointments.find((appointment) => appointment.patient_id === queuePatientId);

    await createTicket.mutateAsync({
      patient_id: queuePatientId,
      appointment_id: futureAppointment?.id,
      numeroTicket: buildTicketNumber(queueTickets, queuePriority),
      ecranCible: queueScreen,
      statut: "en_attente",
      priorite: queuePriority,
      heureArrivee: nowIso,
      heureAppel: "",
      heureConsultation: "",
      heureSortie: "",
      notes: ""
    });

    setQueuePatientId("");
    setQueuePriority("normale");
  }

  async function updateQueueStatus(ticket: WaitingQueueTicket, nextStatus: QueueTicketStatus) {
    const nowIso = new Date().toISOString();
    const patch: Partial<WaitingQueueTicket> = { statut: nextStatus };

    if (nextStatus === "appele") {
      patch.heureAppel = nowIso;
    }
    if (nextStatus === "en_consultation") {
      patch.heureConsultation = nowIso;
    }
    if (nextStatus === "termine" || nextStatus === "absent") {
      patch.heureSortie = nowIso;
    }

    await updateTicket.mutateAsync({ id: ticket.id, patch });
  }

  async function callNextTicket() {
    const nextTicket = filteredQueue.find((ticket) => ticket.statut === "en_attente");
    if (!nextTicket) {
      return;
    }
    await updateQueueStatus(nextTicket, "appele");
  }

  async function saveAndRefreshTV() {
    setTvSyncFeedback(null);
    setTvSyncing(true);
    try {
      await Promise.all([
        tvQuery.refetch(),
        audioQuery.refetch(),
        queueQuery.refetch()
      ]);
      const payload = triggerTVSync(screenFilter === "all" ? "all" : screenFilter, "manager");
      setTvSyncFeedback({
        tone: "success",
        text: `Diffusion TV rafraîchie à ${format(parseISO(payload.at), "HH:mm:ss")}.`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      setTvSyncFeedback({
        tone: "error",
        text: `Synchronisation TV impossible: ${message}`
      });
    } finally {
      setTvSyncing(false);
    }
  }

  async function downloadContentMedia(content: TVContent) {
    setMediaTransferFeedback(null);
    if (!content.media.trim()) {
      setMediaTransferFeedback({ tone: "error", text: "Aucun média à télécharger pour ce contenu." });
      return;
    }

    const fallbackName = `${content.titre || "contenu-tv"}.${content.type === "video" ? "mp4" : "png"}`;

    try {
      await downloadMediaReference(resolveTVMediaSrc(content.media, content.type, content.titre), fallbackName);
      setMediaTransferFeedback({ tone: "success", text: `Média téléchargé: ${content.titre}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      setMediaTransferFeedback({ tone: "error", text: `Téléchargement impossible: ${message}` });
    }
  }

  async function downloadAudioMedia(track: TVAudioTrack) {
    setMediaTransferFeedback(null);
    if (!track.url.trim()) {
      setMediaTransferFeedback({ tone: "error", text: "Aucun audio à télécharger pour cette piste." });
      return;
    }

    const fallbackName = `${track.titre || "piste-audio"}.mp3`;

    try {
      await downloadMediaReference(resolveTVMediaSrc(track.url, "info_cabinet", track.titre), fallbackName);
      setMediaTransferFeedback({ tone: "success", text: `Audio téléchargé: ${track.titre}` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      setMediaTransferFeedback({ tone: "error", text: `Téléchargement impossible: ${message}` });
    }
  }

  async function uploadAudioFile(file: File) {
    setAudioFormFeedback(null);
    if (!file.type.startsWith("audio/")) {
      setAudioUploadError("Le fichier doit être un audio (mp3/wav/ogg/m4a). ");
      return;
    }

    const maxAudioBytes = 1000 * 1024 * 1024;
    if (file.size > maxAudioBytes) {
      setAudioUploadError("Audio trop lourd (max 1000 MB).");
      return;
    }

    setAudioUploadError("");
    setAudioUploading(true);
    try {
      const uploaded = await base44.integrations.Core.UploadFile(file);
      setAudioUrl(uploaded.url);
      if (!audioTitre) {
        const fileName = file.name.replace(/\.[^.]+$/, "");
        setAudioTitre(fileName || "Nouvelle piste");
      }
      setAudioFormFeedback({
        tone: "success",
        text: isLocalMediaRef(uploaded.url)
          ? "Audio lourd stocké localement. Clique sur Ajouter piste pour enregistrer."
          : "Audio uploadé. Clique sur Ajouter piste pour enregistrer."
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      setAudioUploadError(`Upload audio impossible: ${message}`);
    } finally {
      setAudioUploading(false);
    }
  }

  async function submitAudioForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAudioFormFeedback(null);

    if (!audioUrl.trim()) {
      setAudioUploadError("Ajoute une URL audio ou upload un fichier audio.");
      return;
    }

    setAudioUploadError("");
    const isEditing = Boolean(selectedAudio);
    const payload: Omit<TVAudioTrack, "id" | "createdAt" | "updatedAt"> = {
      titre: audioTitre.trim() || "Piste audio",
      artiste: audioArtiste.trim(),
      ecranCible: audioScreen,
      ordre: Math.max(1, Number(audioOrdre) || 1),
      url: audioUrl.trim(),
      actif: audioActif,
      loopMode: selectedAudio?.loopMode ?? "playlist",
      volume: selectedAudio?.volume ?? 0.7
    };

    try {
      if (selectedAudio) {
        await updateAudio.mutateAsync({ id: selectedAudio.id, patch: payload });
      } else {
        await createAudio.mutateAsync(payload);
      }
      setSelectedAudio(null);
      setAudioUploadError("");
      setAudioFormFeedback({
        tone: "success",
        text: isEditing ? "Piste modifiée avec succès." : "Piste ajoutée avec succès."
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      setAudioFormFeedback({
        tone: "error",
        text: `Enregistrement impossible: ${message}`
      });
    }
  }

  async function toggleAudioActive(track: TVAudioTrack) {
    await updateAudio.mutateAsync({
      id: track.id,
      patch: { actif: !track.actif }
    });
  }

  const queueStats = {
    waiting: filteredQueue.filter((ticket) => ticket.statut === "en_attente").length,
    called: filteredQueue.filter((ticket) => ticket.statut === "appele").length,
    inConsultation: filteredQueue.filter((ticket) => ticket.statut === "en_consultation").length
  };

  const audioStats = {
    total: filteredAudioTracks.length,
    active: filteredAudioTracks.filter((item) => item.actif).length
  };
  const hasPendingMutation = createContent.isPending
    || updateContent.isPending
    || deleteContent.isPending
    || createAudio.isPending
    || updateAudio.isPending
    || deleteAudio.isPending
    || createTicket.isPending
    || updateTicket.isPending
    || deleteTicket.isPending;
  const resolvedAudioPreviewUrl = useResolvedMediaUrl(audioUrl, "info_cabinet", audioTitre);

  return (
    <div className="space-y-5">
      <header className="app-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Affichage salle d'attente</p>
          <h1 className="text-2xl font-bold text-slate-900">TV Manager</h1>
        </div>

        <div className="flex flex-col gap-2 lg:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              to="/tv-display/salle_attente"
              target="_blank"
            >
              <ExternalLink className="h-4 w-4" />
              Ouvrir TV Display
            </Link>
            <Button variant="outline" onClick={() => void saveAndRefreshTV()} disabled={tvSyncing || hasPendingMutation}>
              <RefreshCw className={`h-4 w-4 ${tvSyncing ? "animate-spin" : ""}`} />
              Sauvegarder & rafraîchir TV
            </Button>
            <Button variant="outline" onClick={() => void addWebTestVideo()} disabled={createContent.isPending}>
              <Clapperboard className="h-4 w-4" />
              Ajouter vidéo test
            </Button>
            <Button onClick={callNextTicket} variant="outline" disabled={updateTicket.isPending}>
              <BellRing className="h-4 w-4" />
              Appeler suivant
            </Button>
            <Button
              onClick={() => {
                setSelectedContent(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nouveau contenu
            </Button>
          </div>
          {tvSyncFeedback ? (
            <p className={tvSyncFeedback.tone === "success" ? "text-xs font-semibold text-emerald-700" : "text-xs font-semibold text-rose-600"}>
              {tvSyncFeedback.text}
            </p>
          ) : null}
          {mediaTransferFeedback ? (
            <p className={mediaTransferFeedback.tone === "success" ? "text-xs font-semibold text-emerald-700" : "text-xs font-semibold text-rose-600"}>
              {mediaTransferFeedback.text}
            </p>
          ) : null}
        </div>
      </header>

      <Card className="p-4">
        <div className="mb-4 flex items-center gap-2">
          <UsersRound className="h-4 w-4 text-tv" />
          <h2 className="text-base font-semibold">File d'attente patients</h2>
        </div>

        <div className="grid gap-3 lg:grid-cols-[2fr,1fr]">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="label-text">Patient</label>
              <Select value={queuePatientId} onChange={(event) => setQueuePatientId(event.target.value)}>
                <option value="">Sélectionner un patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.prenom} {patient.nom}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="label-text">Priorité</label>
              <Select value={queuePriority} onChange={(event) => setQueuePriority(event.target.value as QueueTicketPriority)}>
                {Object.entries(QUEUE_PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="label-text">Écran</label>
              <Select value={queueScreen} onChange={(event) => setQueueScreen(event.target.value as TVTargetScreen)}>
                <option value="salle_attente">Salle d'attente</option>
                <option value="accueil">Accueil</option>
                <option value="toutes">Toutes</option>
              </Select>
            </div>
            <div className="md:col-span-4 flex items-end gap-2">
              <Button onClick={() => void createQueueTicket()} disabled={createTicket.isPending || !queuePatientId}>
                <Plus className="h-4 w-4" />
                Ajouter ticket
              </Button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-xs uppercase tracking-wide text-amber-700">En attente</p>
              <p className="text-2xl font-bold text-amber-900">{queueStats.waiting}</p>
            </div>
            <div className="rounded-lg bg-violet-50 p-3">
              <p className="text-xs uppercase tracking-wide text-violet-700">Appelés</p>
              <p className="text-2xl font-bold text-violet-900">{queueStats.called}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700">En consultation</p>
              <p className="text-2xl font-bold text-emerald-900">{queueStats.inConsultation}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <AudioLines className="h-4 w-4 text-social" />
            <h2 className="text-base font-semibold">Audio ambiance (diffusion continue)</h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="social">{audioStats.total} piste(s)</Badge>
            <Badge tone="appointments">{audioStats.active} active(s)</Badge>
          </div>
        </div>

        <p className="mb-3 text-sm text-slate-600">
          Cette playlist est indépendante des contenus TV. Elle reste diffusée en continu dans le lecteur du bas sur TV Display.
        </p>
        <p className="mb-3 text-xs font-medium text-slate-500">
          {selectedAudio ? `Mode édition: ${selectedAudio.titre}` : "Mode création: nouvelle piste audio"}
        </p>

        <form ref={audioFormRef} className="grid gap-3" onSubmit={submitAudioForm}>
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="label-text">Titre</label>
              <Input value={audioTitre} onChange={(event) => setAudioTitre(event.target.value)} placeholder="Musique douce matin" required />
            </div>
            <div>
              <label className="label-text">Artiste / Source</label>
              <Input value={audioArtiste} onChange={(event) => setAudioArtiste(event.target.value)} placeholder="Cabinet playlist" />
            </div>
            <div>
              <label className="label-text">Écran</label>
              <Select value={audioScreen} onChange={(event) => setAudioScreen(event.target.value as TVTargetScreen)}>
                <option value="salle_attente">Salle d'attente</option>
                <option value="accueil">Accueil</option>
                <option value="toutes">Toutes</option>
              </Select>
            </div>
            <div>
              <label className="label-text">Ordre</label>
              <Input type="number" min={1} value={audioOrdre} onChange={(event) => setAudioOrdre(Number(event.target.value))} />
            </div>
          </div>

          <div>
            <label className="label-text">URL audio</label>
            <div className="mb-2 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {audioUploading ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Upload audio...
                  </>
                ) : (
                  <>
                    <AudioLines className="h-4 w-4" />
                    Uploader audio
                  </>
                )}
                <input
                  className="hidden"
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a,audio/flac"
                  disabled={audioUploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void uploadAudioFile(file);
                    }
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>

            <Input value={audioUrl} onChange={(event) => setAudioUrl(event.target.value)} placeholder="https://.../track.mp3 ou /media/track.mp3 ou localmedia://..." required />
            {isLocalMediaRef(audioUrl) ? (
              <p className="mt-1 text-xs text-slate-500">Cette piste est sauvegardée localement dans le navigateur.</p>
            ) : null}
            {audioUploadError ? <p className="mt-1 text-xs font-semibold text-rose-600">{audioUploadError}</p> : null}
            {resolvedAudioPreviewUrl ? <audio className="mt-2 w-full" src={resolvedAudioPreviewUrl} controls /> : null}
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={audioActif} onChange={(event) => setAudioActif(event.target.checked)} />
            Piste active
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              disabled={createAudio.isPending || updateAudio.isPending || audioUploading || !audioTitre.trim() || !audioUrl.trim()}
            >
              {selectedAudio ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {selectedAudio ? "Enregistrer modifications" : "Ajouter piste"}
            </Button>
            {selectedAudio ? (
              <Button type="button" variant="outline" onClick={resetAudioForm}>
                Annuler édition
              </Button>
            ) : null}
          </div>
          {audioFormFeedback ? (
            <p
              className={
                audioFormFeedback.tone === "success"
                  ? "text-xs font-semibold text-emerald-700"
                  : "text-xs font-semibold text-rose-600"
              }
            >
              {audioFormFeedback.text}
            </p>
          ) : null}
        </form>

        <div className="mt-4 overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Ordre</th>
                <th>Titre</th>
                <th>Écran</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredAudioTracks.map((track) => (
                <tr key={track.id}>
                  <td>{track.ordre}</td>
                  <td>
                    <p className="font-semibold text-slate-900">{track.titre}</p>
                    <p className="text-xs text-slate-500">{track.artiste || "-"}</p>
                    {isLocalMediaRef(track.url) ? <p className="text-[11px] font-medium text-slate-500">Stocké local</p> : null}
                  </td>
                  <td>{track.ecranCible}</td>
                  <td>
                    <Badge tone={track.actif ? "appointments" : "muted"}>{track.actif ? "Actif" : "Inactif"}</Badge>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" type="button" onClick={() => void toggleAudioActive(track)}>
                        {track.actif ? "Désactiver" : "Activer"}
                      </Button>
                      <Button size="sm" variant="outline" type="button" onClick={() => void downloadAudioMedia(track)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" type="button" onClick={() => startEditingAudio(track)}>
                        <Pencil className="h-4 w-4" />
                        Modifier
                      </Button>
                      <Button size="sm" variant="danger" type="button" onClick={() => void deleteAudio.mutateAsync(track.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredAudioTracks.length ? (
                <tr>
                  <td colSpan={5} className="text-sm text-slate-500">Aucune piste audio configurée.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Tickets en cours</h2>
          <Badge tone="tv">{filteredQueue.length} ticket(s)</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Patient</th>
                <th>Priorité</th>
                <th>Écran</th>
                <th>Statut</th>
                <th>Arrivée</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredQueue.map((ticket) => {
                const patient = patientMap.get(ticket.patient_id);
                return (
                  <tr key={ticket.id}>
                    <td className="font-semibold text-slate-900">{ticket.numeroTicket}</td>
                    <td>{patient ? `${patient.prenom} ${patient.nom}` : "Patient inconnu"}</td>
                    <td>
                      <Badge tone={ticket.priorite === "urgence" ? "danger" : ticket.priorite === "prioritaire" ? "tv" : "muted"}>
                        {QUEUE_PRIORITY_LABELS[ticket.priorite]}
                      </Badge>
                    </td>
                    <td>{ticket.ecranCible}</td>
                    <td>
                      <Badge tone={queueStatusTone(ticket.statut)}>{QUEUE_STATUS_LABELS[ticket.statut]}</Badge>
                    </td>
                    <td>{format(new Date(ticket.heureArrivee), "HH:mm:ss")}</td>
                    <td>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {ticket.statut === "en_attente" ? (
                          <Button size="sm" onClick={() => void updateQueueStatus(ticket, "appele")}>
                            <BellRing className="h-4 w-4" />
                            Appeler
                          </Button>
                        ) : null}

                        {ticket.statut === "appele" ? (
                          <Button size="sm" variant="outline" onClick={() => void updateQueueStatus(ticket, "en_consultation")}>
                            <Radio className="h-4 w-4" />
                            Consultation
                          </Button>
                        ) : null}

                        {ticket.statut === "en_consultation" ? (
                          <Button size="sm" variant="outline" onClick={() => void updateQueueStatus(ticket, "termine")}>
                            <CheckCircle2 className="h-4 w-4" />
                            Terminer
                          </Button>
                        ) : null}

                        {(ticket.statut === "en_attente" || ticket.statut === "appele") ? (
                          <Button size="sm" variant="danger" onClick={() => void updateQueueStatus(ticket, "absent")}>
                            <UserRoundX className="h-4 w-4" />
                            Absent
                          </Button>
                        ) : null}

                        {(ticket.statut === "termine" || ticket.statut === "absent") ? (
                          <Button size="sm" variant="danger" onClick={() => void deleteTicket.mutateAsync(ticket.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label-text">Filtre écran</label>
            <Select value={screenFilter} onChange={(event) => setScreenFilter(event.target.value as TVTargetScreen | "all")}> 
              <option value="all">Tous</option>
              <option value="salle_attente">Salle d'attente</option>
              <option value="accueil">Accueil</option>
              <option value="toutes">Toutes</option>
            </Select>
          </div>
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="text-xs uppercase tracking-wide text-amber-700">Actifs</p>
            <p className="text-2xl font-bold text-amber-800">{filteredContents.filter((item) => item.actif).length}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Contenus programmés</h2>
          <Badge tone="tv">{filteredContents.length} élément(s)</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Ordre</th>
                <th>Titre</th>
                <th>Type</th>
                <th>Écran</th>
                <th>Durée</th>
                <th>Période</th>
                <th>Statut</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredContents.map((content) => (
                <tr key={content.id}>
                  <td>{content.ordre}</td>
                  <td>
                    <p className="font-semibold text-slate-900">{content.titre}</p>
                    <p className="text-xs text-slate-500">{content.message}</p>
                    <TVContentMediaThumb content={content} />
                  </td>
                  <td>
                    <Badge tone="tv">{TV_TYPE_LABELS[content.type]}</Badge>
                  </td>
                  <td>{content.ecranCible}</td>
                  <td>{content.dureeAffichage}s</td>
                  <td>
                    {content.dateDebut} → {content.dateFin}
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      {content.actif ? <Badge tone="appointments">Actif</Badge> : <Badge tone="muted">Inactif</Badge>}
                      {isBroadcastingNow(content) ? <Badge tone="tv">En diffusion</Badge> : <Badge tone="muted">Hors diffusion</Badge>}
                      <Button variant="outline" size="sm" onClick={() => void toggleActive(content)}>
                        {content.actif ? "Désactiver" : "Activer"}
                      </Button>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      {!isBroadcastingNow(content) ? (
                        <Button variant="default" size="sm" onClick={() => void publishNow(content)}>
                          <Radio className="h-4 w-4" />
                          Diffuser
                        </Button>
                      ) : null}
                      <Button variant="outline" size="sm" onClick={() => void downloadContentMedia(content)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContent(content);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => void deleteContent.mutateAsync(content.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="app-card flex items-center gap-2 p-4 text-sm text-slate-600">
        <MonitorPlay className="h-4 w-4 text-tv" />
        Page TV standalone sans layout: <code className="rounded bg-slate-100 px-2 py-1">/tv-display/:screen</code>
      </div>

      <div className="app-card p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Comment diffuser</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Configurer la playlist audio dans “Audio ambiance”.</li>
          <li>Ajouter/activer les contenus visuels dans “Contenus programmés”.</li>
          <li>Les médias lourds sont stockés localement; utiliser l'icône <strong>Download</strong> pour exporter un fichier.</li>
          <li>Mettre le statut visuel `Actif` ou cliquer sur <strong>Diffuser</strong>.</li>
          <li>Ajouter les tickets file d'attente pour afficher les numéros en temps réel.</li>
          <li>Ouvrir <code>/tv-display/salle_attente</code> pour la diffusion plein écran.</li>
        </ol>
      </div>

      <TVContentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={selectedContent}
        isPending={createContent.isPending || updateContent.isPending}
        onSubmit={submitForm}
      />
    </div>
  );
}
