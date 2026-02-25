import { BarChart3, MessageCircle, Pencil, Plus, Share2, ThumbsUp, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { MetricCard } from "../components/cards/MetricCard";
import { SocialPostFormDialog } from "../components/forms/SocialPostFormDialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useEntityCreate, useEntityDelete, useEntityList, useEntityUpdate } from "../hooks/useEntities";
import { SOCIAL_STATUS_LABELS, type SocialPost } from "../types/entities";

function statusTone(status: SocialPost["statut"]): "social" | "muted" | "appointments" {
  if (status === "publie") {
    return "appointments";
  }
  if (status === "planifie") {
    return "social";
  }
  return "muted";
}

export function SocialMediaPage() {
  const postsQuery = useEntityList("SocialPost");
  const createPost = useEntityCreate("SocialPost");
  const updatePost = useEntityUpdate("SocialPost");
  const deletePost = useEntityDelete("SocialPost");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null);

  const posts = postsQuery.data ?? [];

  const totals = useMemo(() => {
    return posts.reduce(
      (acc, post) => {
        acc.likes += post.metrics.likes;
        acc.commentaires += post.metrics.commentaires;
        acc.partages += post.metrics.partages;
        return acc;
      },
      { likes: 0, commentaires: 0, partages: 0 }
    );
  }, [posts]);

  async function submitForm(payload: Omit<SocialPost, "id" | "createdAt" | "updatedAt">) {
    if (editingPost) {
      await updatePost.mutateAsync({ id: editingPost.id, patch: payload });
      return;
    }
    await createPost.mutateAsync(payload);
  }

  async function removePost(id: string) {
    await deletePost.mutateAsync(id);
  }

  return (
    <div className="space-y-5">
      <header className="app-card flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Instagram & Google Business</p>
          <h1 className="text-2xl font-bold text-slate-900">Gestion réseaux sociaux</h1>
        </div>

        <Button
          onClick={() => {
            setEditingPost(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Nouveau post
        </Button>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Likes" value={totals.likes} icon={<ThumbsUp className="h-4 w-4 text-social" />} />
        <MetricCard label="Commentaires" value={totals.commentaires} icon={<MessageCircle className="h-4 w-4 text-social" />} />
        <MetricCard label="Partages" value={totals.partages} icon={<Share2 className="h-4 w-4 text-social" />} />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        {posts.map((post) => (
          <Card key={post.id} className="p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{post.titre}</h2>
                <p className="text-xs text-slate-500">Plateforme: {post.plateforme}</p>
              </div>
              <Badge tone={statusTone(post.statut)}>{SOCIAL_STATUS_LABELS[post.statut]}</Badge>
            </div>

            {post.image ? <img src={post.image} alt={post.titre} className="mb-3 h-40 w-full rounded-lg object-cover" /> : null}

            <p className="mb-3 text-sm text-slate-700">{post.contenu}</p>

            <div className="mb-3 flex flex-wrap gap-1">
              {post.hashtags.map((hashtag) => (
                <span key={`${post.id}-${hashtag}`} className="rounded-full bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
                  {hashtag}
                </span>
              ))}
            </div>

            <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="font-semibold text-slate-900">{post.metrics.likes}</p>
                <p className="text-slate-500">Likes</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="font-semibold text-slate-900">{post.metrics.commentaires}</p>
                <p className="text-slate-500">Commentaires</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                <p className="font-semibold text-slate-900">{post.metrics.partages}</p>
                <p className="text-slate-500">Partages</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                <BarChart3 className="h-3.5 w-3.5" />
                Planifié le {post.datePlanification || "-"}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingPost(post);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Button>
                <Button variant="danger" size="sm" onClick={() => void removePost(post.id)}>
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <SocialPostFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingPost}
        isPending={createPost.isPending || updatePost.isPending}
        onSubmit={submitForm}
      />
    </div>
  );
}
