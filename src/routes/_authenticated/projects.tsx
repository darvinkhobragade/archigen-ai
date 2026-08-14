import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Search, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/archigen/generator";
import {
  coverFor,
  projectTypes,
  relativeTime,
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
  type ProjectRow,
} from "@/hooks/use-projects";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Projects — ArchiGen AI" },
      {
        name: "description",
        content: "Every saved ArchiGen AI design project, with favorites and asset counts.",
      },
      { property: "og:title", content: "Projects — ArchiGen AI" },
      { property: "og:description", content: "Browse and manage your saved AI design projects." },
    ],
  }),
  component: ProjectsPage,
});

const filters = ["All", ...projectTypes] as const;

type Draft = { id?: string; title: string; type: string; description: string };

const emptyDraft: Draft = { title: "", type: "Architecture", description: "" };

function ProjectsPage() {
  const [filter, setFilter] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectRow | null>(null);

  const { data: projects = [], isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const visible = projects.filter(
    (p) =>
      (filter === "All" || p.type === filter) &&
      p.title.toLowerCase().includes(query.toLowerCase()),
  );

  async function saveDraft() {
    if (!draft || !draft.title.trim()) return;
    if (draft.id) {
      await updateProject.mutateAsync({
        id: draft.id,
        title: draft.title.trim(),
        type: draft.type,
        description: draft.description || null,
      });
    } else {
      await createProject.mutateAsync({
        title: draft.title.trim(),
        type: draft.type,
        description: draft.description,
      });
    }
    setDraft(null);
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description="Everything you have saved, newest first."
        actions={
          <Button onClick={() => setDraft({ ...emptyDraft })}>
            <Plus className="size-4" /> New project
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="surface-panel grid place-items-center p-12">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <div className="surface-panel p-12 text-center text-sm text-muted-foreground">
          {projects.length === 0
            ? "No projects yet — create your first one to start saving concepts."
            : "No projects match that search yet."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <article
              key={p.id}
              className="surface-panel overflow-hidden transition-colors hover:border-primary/50"
            >
              <div className="relative">
                <img
                  src={coverFor(p)}
                  alt={p.title}
                  loading="lazy"
                  className="h-44 w-full object-cover"
                />
                <button
                  type="button"
                  aria-label={p.is_favorite ? "Remove from favorites" : "Add to favorites"}
                  onClick={() => updateProject.mutate({ id: p.id, is_favorite: !p.is_favorite })}
                  className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-background/80 transition-colors hover:bg-background"
                >
                  <Heart
                    className={`size-4 ${p.is_favorite ? "fill-primary text-primary" : "text-muted-foreground"}`}
                  />
                </button>
              </div>
              <div className="p-4">
                <Badge variant="outline" className="text-muted-foreground">
                  {p.type}
                </Badge>
                <h2 className="mt-2 truncate font-semibold">{p.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  updated {relativeTime(p.updated_at)}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setDraft({
                        id: p.id,
                        title: p.title,
                        type: p.type,
                        description: p.description ?? "",
                      })
                    }
                  >
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingDelete(p)}>
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit project" : "New project"}</DialogTitle>
            <DialogDescription>Projects group the concepts you generate.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={draft?.title ?? ""}
                onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                placeholder="Coastal Villa — Alibaug"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={draft?.type ?? "Architecture"}
                onValueChange={(v) => setDraft((d) => (d ? { ...d, type: v } : d))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={draft?.description ?? ""}
                onChange={(e) => setDraft((d) => (d ? { ...d, description: e.target.value } : d))}
                placeholder="Brief, site notes, client requirements…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              onClick={saveDraft}
              disabled={!draft?.title.trim() || createProject.isPending || updateProject.isPending}
            >
              {(createProject.isPending || updateProject.isPending) && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {draft?.id ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the project. Generations linked to it stay in your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteProject.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
