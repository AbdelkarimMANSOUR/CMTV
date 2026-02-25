import { useEffect, useState, type FormEvent } from "react";
import { addDays, format } from "date-fns";
import { Film, ImagePlus, LoaderCircle } from "lucide-react";
import { base44 } from "../../lib/base44";
import { useResolvedMediaUrl } from "../../hooks/useResolvedMediaUrl";
import { isLocalMediaRef } from "../../lib/localMediaStore";
import type { TVContent, TVContentType, TVTargetScreen } from "../../types/entities";
import { TV_TYPE_LABELS } from "../../types/entities";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";

type TVContentInput = Omit<TVContent, "id" | "createdAt" | "updatedAt">;

type TVContentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: TVContent | null;
  isPending?: boolean;
  onSubmit: (payload: TVContentInput) => Promise<void> | void;
};

const tvTypes: TVContentType[] = ["annonce", "conseil_sante", "info_cabinet", "video", "image", "message_defilant"];
const targetScreens: TVTargetScreen[] = ["salle_attente", "accueil", "toutes"];

const emptyForm: TVContentInput = {
  titre: "",
  type: "annonce",
  dureeAffichage: 10,
  ordre: 1,
  ecranCible: "salle_attente",
  dateDebut: "",
  dateFin: "",
  couleurFond: "#0f172a",
  media: "",
  message: "",
  actif: true
};

export function TVContentFormDialog({
  open,
  onOpenChange,
  initialData,
  isPending,
  onSubmit
}: TVContentFormDialogProps) {
  const [form, setForm] = useState<TVContentInput>(emptyForm);
  const [uploading, setUploading] = useState<"image" | "video" | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadInfo, setUploadInfo] = useState("");
  const resolvedFormMediaUrl = useResolvedMediaUrl(form.media, form.type, form.titre);

  useEffect(() => {
    if (initialData) {
      setForm({
        titre: initialData.titre,
        type: initialData.type,
        dureeAffichage: initialData.dureeAffichage,
        ordre: initialData.ordre,
        ecranCible: initialData.ecranCible,
        dateDebut: initialData.dateDebut,
        dateFin: initialData.dateFin,
        couleurFond: initialData.couleurFond,
        media: initialData.media,
        message: initialData.message,
        actif: initialData.actif
      });
      setUploadInfo("");
      return;
    }

    setForm(emptyForm);
    setUploadInfo("");
  }, [initialData, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(form);
    onOpenChange(false);
  }

  async function handleUploadMedia(file: File, preferredType: "image" | "video") {
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setUploadError("Format non supporté. Utilisez une image ou une vidéo.");
      return;
    }

    if (preferredType === "video" && !isVideo) {
      setUploadError("Le fichier sélectionné n'est pas une vidéo.");
      return;
    }

    if (preferredType === "image" && !isImage) {
      setUploadError("Le fichier sélectionné n'est pas une image.");
      return;
    }

    // Allow large video uploads for waiting-room display workflow
    const maxVideoBytes = 1000 * 1024 * 1024;
    const maxImageBytes = 5 * 1024 * 1024;
    if (isVideo && file.size > maxVideoBytes) {
      setUploadError("Vidéo trop lourde (max 1000 MB).");
      return;
    }
    if (isImage && file.size > maxImageBytes) {
      setUploadError("Image trop lourde (max 5 MB pour cette démo).");
      return;
    }

    setUploadError("");
    setUploadInfo("");
    setUploading(preferredType);
    try {
      const uploaded = await base44.integrations.Core.UploadFile(file);
      const today = new Date();
      setForm((p) => ({
        ...p,
        type: isVideo ? "video" : "image",
        media: uploaded.url,
        actif: true,
        titre: p.titre || (isVideo ? "Vidéo informative" : "Image informative"),
        message: p.message || (isVideo ? "Contenu vidéo en diffusion" : "Contenu image en diffusion"),
        dateDebut: p.dateDebut || format(today, "yyyy-MM-dd"),
        dateFin: p.dateFin || format(addDays(today, 30), "yyyy-MM-dd"),
        dureeAffichage: isVideo ? Math.max(p.dureeAffichage, 20) : p.dureeAffichage
      }));
      if (isLocalMediaRef(uploaded.url)) {
        setUploadInfo("Média lourd stocké localement dans ce navigateur.");
      }
    } finally {
      setUploading(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader title={initialData ? "Modifier contenu TV" : "Nouveau contenu TV"} description="Gestion diffusion salle d'attente" />

        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div>
            <label className="label-text">Titre</label>
            <Input value={form.titre} onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))} required />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="label-text">Type</label>
              <Select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as TVContentType }))}>
                {tvTypes.map((type) => (
                  <option key={type} value={type}>
                    {TV_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="label-text">Écran cible</label>
              <Select value={form.ecranCible} onChange={(e) => setForm((p) => ({ ...p, ecranCible: e.target.value as TVTargetScreen }))}>
                {targetScreens.map((screen) => (
                  <option key={screen} value={screen}>
                    {screen}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="label-text">Durée (sec)</label>
              <Input
                type="number"
                min={3}
                value={form.dureeAffichage}
                onChange={(e) => setForm((p) => ({ ...p, dureeAffichage: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="label-text">Ordre</label>
              <Input type="number" min={1} value={form.ordre} onChange={(e) => setForm((p) => ({ ...p, ordre: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label-text">Date début</label>
              <Input type="date" value={form.dateDebut} onChange={(e) => setForm((p) => ({ ...p, dateDebut: e.target.value }))} />
            </div>
            <div>
              <label className="label-text">Date fin</label>
              <Input type="date" value={form.dateFin} onChange={(e) => setForm((p) => ({ ...p, dateFin: e.target.value }))} />
            </div>
            <div>
              <label className="label-text">Couleur fond</label>
              <Input type="color" value={form.couleurFond} onChange={(e) => setForm((p) => ({ ...p, couleurFond: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label-text">Media (URL image/vidéo)</label>
            <div className="mb-2 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <ImagePlus className="h-4 w-4" />
                {uploading === "image" ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Upload image...
                  </>
                ) : (
                  "Uploader image"
                )}
                <input
                  className="hidden"
                  type="file"
                  accept="image/*"
                  disabled={uploading !== null}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleUploadMedia(file, "image");
                    }
                    event.currentTarget.value = "";
                  }}
                />
              </label>

              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Film className="h-4 w-4" />
                {uploading === "video" ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Upload vidéo...
                  </>
                ) : (
                  "Uploader vidéo"
                )}
                <input
                  className="hidden"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  disabled={uploading !== null}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleUploadMedia(file, "video");
                    }
                    event.currentTarget.value = "";
                  }}
                />
              </label>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  setForm((p) => ({
                    ...p,
                    type: "image",
                    titre: p.titre || "Logo",
                    media: "/logo-cabinet.svg",
                    message: p.message || "Logo officiel du cabinet",
                    actif: true,
                    dateDebut: p.dateDebut || format(today, "yyyy-MM-dd"),
                    dateFin: p.dateFin || format(addDays(today, 30), "yyyy-MM-dd")
                  }));
                }}
              >
                Utiliser le logo cabinet
              </Button>
            </div>
            <Input
              value={form.media}
              onChange={(e) => setForm((p) => ({ ...p, media: e.target.value }))}
              placeholder="https://... ou /logo-cabinet.svg ou logo ou /media/demo-test.mp4"
            />
            <p className="mt-1 text-xs text-slate-500">
              Tu peux écrire <code>logo</code> ou <code>/logo-cabinet.svg</code> pour le logo, et une URL MP4/WebM pour la vidéo.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Les médias lourds sont stockés localement dans le navigateur pour garder la diffusion stable après rafraîchissement.
            </p>
            {isLocalMediaRef(form.media) ? <p className="mt-1 text-xs font-medium text-slate-500">Média local détecté (localmedia://).</p> : null}
            {uploadInfo ? <p className="mt-1 text-xs font-semibold text-emerald-700">{uploadInfo}</p> : null}
            {uploadError ? <p className="mt-1 text-xs font-semibold text-rose-600">{uploadError}</p> : null}
            {resolvedFormMediaUrl && form.type === "image" ? (
              <img src={resolvedFormMediaUrl} alt="Aperçu média TV" className="mt-2 h-24 w-24 rounded-lg border border-slate-200 object-contain bg-slate-50 p-1" />
            ) : null}
            {resolvedFormMediaUrl && form.type === "video" ? (
              <video src={resolvedFormMediaUrl} className="mt-2 h-28 w-44 rounded-lg border border-slate-200 bg-slate-950 object-cover" controls muted />
            ) : null}
          </div>

          <div>
            <label className="label-text">Message</label>
            <Textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.actif} onChange={(e) => setForm((p) => ({ ...p, actif: e.target.checked }))} />
            Contenu actif
          </label>

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
