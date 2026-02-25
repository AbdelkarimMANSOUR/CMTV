import { WandSparkles, Upload } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { base44 } from "../../lib/base44";
import type { SocialPlatform, SocialPost, SocialStatus } from "../../types/entities";
import { SOCIAL_STATUS_LABELS } from "../../types/entities";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Textarea } from "../ui/textarea";

type SocialPostInput = Omit<SocialPost, "id" | "createdAt" | "updatedAt">;

type SocialPostFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: SocialPost | null;
  isPending?: boolean;
  onSubmit: (payload: SocialPostInput) => Promise<void> | void;
};

const emptyForm: SocialPostInput = {
  titre: "",
  contenu: "",
  plateforme: "instagram",
  image: "",
  statut: "brouillon",
  hashtags: [],
  datePlanification: "",
  metrics: {
    likes: 0,
    commentaires: 0,
    partages: 0
  }
};

const platformOptions: SocialPlatform[] = ["instagram", "google", "both"];
const statusOptions: SocialStatus[] = ["brouillon", "planifie", "publie"];

export function SocialPostFormDialog({
  open,
  onOpenChange,
  initialData,
  isPending,
  onSubmit
}: SocialPostFormDialogProps) {
  const [form, setForm] = useState<SocialPostInput>(emptyForm);
  const [hashtagsInput, setHashtagsInput] = useState("");
  const [iaLoading, setIaLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        titre: initialData.titre,
        contenu: initialData.contenu,
        plateforme: initialData.plateforme,
        image: initialData.image,
        statut: initialData.statut,
        hashtags: initialData.hashtags,
        datePlanification: initialData.datePlanification,
        metrics: initialData.metrics
      });
      setHashtagsInput(initialData.hashtags.join(", "));
      return;
    }

    setForm(emptyForm);
    setHashtagsInput("");
  }, [initialData, open]);

  async function generateWithAI() {
    setIaLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: "Génère un post réseaux sociaux pour Instagram et Google Business pour un cabinet médical.",
        response_json_schema: {
          type: "object",
          properties: {
            titre: { type: "string" },
            contenu: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } }
          }
        }
      });

      const result = (response.json ?? {}) as Partial<{ titre: string; contenu: string; hashtags: string[] }>;

      setForm((prev) => ({
        ...prev,
        titre: result.titre ?? prev.titre,
        contenu: result.contenu ?? prev.contenu,
        hashtags: result.hashtags ?? prev.hashtags
      }));
      if (result.hashtags?.length) {
        setHashtagsInput(result.hashtags.join(", "));
      }
    } finally {
      setIaLoading(false);
    }
  }

  async function handleFileUpload(file: File) {
    setUploadLoading(true);
    try {
      const uploaded = await base44.integrations.Core.UploadFile(file);
      setForm((prev) => ({ ...prev, image: uploaded.url }));
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      ...form,
      hashtags: hashtagsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader title={initialData ? "Modifier post" : "Nouveau post social"} description="Instagram & Google Business" />

        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={generateWithAI} disabled={iaLoading}>
              <WandSparkles className="h-4 w-4" />
              {iaLoading ? "Génération..." : "Générer avec IA"}
            </Button>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <Upload className="h-4 w-4" />
              {uploadLoading ? "Upload..." : "Uploader image"}
              <input
                className="hidden"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleFileUpload(file);
                  }
                }}
              />
            </label>
          </div>

          <div>
            <label className="label-text">Titre</label>
            <Input value={form.titre} onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))} required />
          </div>

          <div>
            <label className="label-text">Contenu</label>
            <Textarea value={form.contenu} onChange={(e) => setForm((p) => ({ ...p, contenu: e.target.value }))} required />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="label-text">Plateforme</label>
              <Select value={form.plateforme} onChange={(e) => setForm((p) => ({ ...p, plateforme: e.target.value as SocialPlatform }))}>
                {platformOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="label-text">Statut</label>
              <Select value={form.statut} onChange={(e) => setForm((p) => ({ ...p, statut: e.target.value as SocialStatus }))}>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {SOCIAL_STATUS_LABELS[option]}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="label-text">Date planification</label>
              <Input type="date" value={form.datePlanification} onChange={(e) => setForm((p) => ({ ...p, datePlanification: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label-text">Hashtags (virgule)</label>
            <Input value={hashtagsInput} onChange={(e) => setHashtagsInput(e.target.value)} placeholder="#cabinet, #sante" />
          </div>

          <div>
            <label className="label-text">URL image</label>
            <Input value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} placeholder="https://..." />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="label-text">Likes</label>
              <Input
                type="number"
                min={0}
                value={form.metrics.likes}
                onChange={(e) => setForm((p) => ({ ...p, metrics: { ...p.metrics, likes: Number(e.target.value) } }))}
              />
            </div>
            <div>
              <label className="label-text">Commentaires</label>
              <Input
                type="number"
                min={0}
                value={form.metrics.commentaires}
                onChange={(e) => setForm((p) => ({ ...p, metrics: { ...p.metrics, commentaires: Number(e.target.value) } }))}
              />
            </div>
            <div>
              <label className="label-text">Partages</label>
              <Input
                type="number"
                min={0}
                value={form.metrics.partages}
                onChange={(e) => setForm((p) => ({ ...p, metrics: { ...p.metrics, partages: Number(e.target.value) } }))}
              />
            </div>
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
