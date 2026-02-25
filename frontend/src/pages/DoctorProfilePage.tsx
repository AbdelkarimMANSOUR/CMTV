import { Globe, Instagram, Pencil, Save, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useEntityCreate, useEntityList, useEntityUpdate } from "../hooks/useEntities";
import type { DoctorProfile } from "../types/entities";

type DoctorProfileInput = Omit<DoctorProfile, "id" | "createdAt" | "updatedAt">;

const emptyProfile: DoctorProfileInput = {
  nom: "",
  specialite: "",
  bio: "",
  photo: "",
  telephone: "",
  email: "",
  adresse: "",
  horaires: "",
  instagramHandle: "",
  instagramFollowers: 0,
  googleBusinessUrl: "",
  googleRating: 0,
  googleReviews: 0,
  siteWeb: ""
};

export function DoctorProfilePage() {
  const profileQuery = useEntityList("DoctorProfile");
  const updateProfile = useEntityUpdate("DoctorProfile");
  const createProfile = useEntityCreate("DoctorProfile");

  const profile = profileQuery.data?.[0] ?? null;

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<DoctorProfileInput>(emptyProfile);

  useEffect(() => {
    if (profile) {
      setForm({
        nom: profile.nom,
        specialite: profile.specialite,
        bio: profile.bio,
        photo: profile.photo,
        telephone: profile.telephone,
        email: profile.email,
        adresse: profile.adresse,
        horaires: profile.horaires,
        instagramHandle: profile.instagramHandle,
        instagramFollowers: profile.instagramFollowers,
        googleBusinessUrl: profile.googleBusinessUrl,
        googleRating: profile.googleRating,
        googleReviews: profile.googleReviews,
        siteWeb: profile.siteWeb
      });
      return;
    }

    setForm(emptyProfile);
  }, [profile]);

  async function saveProfile() {
    if (profile) {
      await updateProfile.mutateAsync({ id: profile.id, patch: form });
    } else {
      await createProfile.mutateAsync(form);
    }
    setIsEditing(false);
  }

  return (
    <div className="space-y-5">
      <header className="app-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Profil Médecin</p>
          <h1 className="text-2xl font-bold text-slate-900">Informations publiques du cabinet</h1>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <Button onClick={() => void saveProfile()} disabled={updateProfile.isPending || createProfile.isPending}>
              <Save className="h-4 w-4" />
              Enregistrer
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
              Éditer
            </Button>
          )}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <Card className="p-4">
          <img
            src={form.photo || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2"}
            alt="Docteur"
            className="mb-3 h-52 w-full rounded-lg object-cover"
          />
          <h2 className="text-lg font-semibold text-slate-900">{form.nom || "Nom médecin"}</h2>
          <p className="text-sm text-slate-600">{form.specialite || "Spécialité"}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="social">{form.instagramFollowers} followers</Badge>
            <Badge tone="appointments">{form.googleRating}/5</Badge>
          </div>
        </Card>

        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label-text">Nom</label>
              <Input value={form.nom} disabled={!isEditing} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} />
            </div>
            <div>
              <label className="label-text">Spécialité</label>
              <Input
                value={form.specialite}
                disabled={!isEditing}
                onChange={(e) => setForm((p) => ({ ...p, specialite: e.target.value }))}
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="label-text">Bio</label>
            <Textarea value={form.bio} disabled={!isEditing} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="label-text">Téléphone</label>
              <Input
                value={form.telephone}
                disabled={!isEditing}
                onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-text">Email</label>
              <Input value={form.email} disabled={!isEditing} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
          </div>

          <div className="mt-3">
            <label className="label-text">Adresse</label>
            <Input value={form.adresse} disabled={!isEditing} onChange={(e) => setForm((p) => ({ ...p, adresse: e.target.value }))} />
          </div>

          <div className="mt-3">
            <label className="label-text">Horaires</label>
            <Input value={form.horaires} disabled={!isEditing} onChange={(e) => setForm((p) => ({ ...p, horaires: e.target.value }))} />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg bg-violet-50 p-3">
              <p className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-violet-700">
                <Instagram className="h-4 w-4" />
                Instagram
              </p>
              <Input
                value={form.instagramHandle}
                disabled={!isEditing}
                onChange={(e) => setForm((p) => ({ ...p, instagramHandle: e.target.value }))}
                placeholder="@handle"
              />
              <Input
                className="mt-2"
                type="number"
                value={form.instagramFollowers}
                disabled={!isEditing}
                onChange={(e) => setForm((p) => ({ ...p, instagramFollowers: Number(e.target.value) }))}
                placeholder="Followers"
              />
            </div>

            <div className="rounded-lg bg-emerald-50 p-3">
              <p className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                <Star className="h-4 w-4" />
                Google Business
              </p>
              <Input
                value={form.googleBusinessUrl}
                disabled={!isEditing}
                onChange={(e) => setForm((p) => ({ ...p, googleBusinessUrl: e.target.value }))}
                placeholder="URL fiche Google"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  max={5}
                  value={form.googleRating}
                  disabled={!isEditing}
                  onChange={(e) => setForm((p) => ({ ...p, googleRating: Number(e.target.value) }))}
                  placeholder="Note /5"
                />
                <Input
                  type="number"
                  min={0}
                  value={form.googleReviews}
                  disabled={!isEditing}
                  onChange={(e) => setForm((p) => ({ ...p, googleReviews: Number(e.target.value) }))}
                  placeholder="Nombre avis"
                />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <label className="label-text">Site web</label>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input className="pl-9" value={form.siteWeb} disabled={!isEditing} onChange={(e) => setForm((p) => ({ ...p, siteWeb: e.target.value }))} />
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
