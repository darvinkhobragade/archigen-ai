import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Heart,
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FolderKanban,
  Layers,
  Sparkles,
  ExternalLink,
  Maximize2,
  FileText,
  Download,
  FolderPlus,
  ArrowUpRight,
  FolderOpen,
  Calendar,
  Grid,
  ListFilter,
  Check,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { PresentationSheet } from "@/components/archigen/presentation-sheet";
import {
  coverFor,
  projectTypes,
  relativeTime,
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
  useProjectGenerations,
  useAllGenerations,
  useActiveProject,
  useAssignGenerationToProject,
  useDeleteGeneration,
  useToggleGenerationFavorite,
  type ProjectRow,
  type GenerationRow,
} from "@/hooks/use-projects";

export type ProjectsSearch = {
  id?: string | undefined;
  tab?: string | undefined;
};

export const Route = createFileRoute("/_authenticated/projects")({
  validateSearch: (search: Record<string, unknown>): ProjectsSearch => ({
    id: typeof search["id"] === "string" ? (search["id"] as string) : undefined,
    tab: typeof search["tab"] === "string" ? (search["tab"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Projects & Generations — ArchiGen AI" },
      {
        name: "description",
        content: "Every saved ArchiGen AI design project and generation gallery.",
      },
      { property: "og:title", content: "Projects & Generations — ArchiGen AI" },
      { property: "og:description", content: "Browse and manage your saved AI design projects and renders." },
    ],
  }),
  component: ProjectsPage,
});

const filters = ["All", ...projectTypes, "Favorites"] as const;
const toolFilters = ["All", "Architecture", "Interior", "Redesign", "Floor Plan", "Favorites"] as const;

type Draft = { id?: string; title: string; type: string; description: string };
const emptyDraft: Draft = { title: "", type: "Architecture", description: "" };

function ProjectsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"projects" | "generations">(
    search["tab"] === "generations" ? "generations" : "projects",
  );
  const [filter, setFilter] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectRow | null>(null);

  // Selected project for Detail Modal
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(search["id"] ?? null);

  // Assign Generation Modal
  const [assignGenTarget, setAssignGenTarget] = useState<GenerationRow | null>(null);
  const [assignTargetProjectId, setAssignTargetProjectId] = useState<string>("");

  // Preview & Presentation Modals
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [presentationData, setPresentationData] = useState<{
    url: string;
    title: string;
    tool: string;
    prompt?: string | undefined;
    seed?: number | undefined;
  } | null>(null);

  // Deleting generation
  const [pendingDeleteGen, setPendingDeleteGen] = useState<GenerationRow | null>(null);

  const { data: projects = [], isLoading: isProjectsLoading } = useProjects();
  const { data: allGenerations = [], isLoading: isGenerationsLoading } = useAllGenerations();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const assignGen = useAssignGenerationToProject();
  const deleteGen = useDeleteGeneration();
  const toggleFavoriteGen = useToggleGenerationFavorite();
  const { setActiveProject } = useActiveProject();

  // Sync search param id with selectedProjectId
  useEffect(() => {
    if (search["id"] && search["id"] !== selectedProjectId) {
      setSelectedProjectId(search["id"]);
    }
  }, [search, selectedProjectId]);

  const openProjectDetail = (projectId: string) => {
    setSelectedProjectId(projectId);
    navigate({
      to: "/projects",
      search: { id: projectId, tab: activeTab },
    });
  };

  const closeProjectDetail = () => {
    setSelectedProjectId(null);
    navigate({
      to: "/projects",
      search: { tab: activeTab },
    });
  };

  // Filtered projects
  const visibleProjects = projects.filter((p) => {
    const matchesQuery = p.title.toLowerCase().includes(query.toLowerCase());
    if (!matchesQuery) return false;
    if (filter === "Favorites") return p.is_favorite;
    if (filter === "All") return true;
    return p.type === filter;
  });

  // Filtered all-generations
  const visibleGenerations = allGenerations.filter((g) => {
    const promptText = (g.prompt || "").toLowerCase();
    const projText = (g.project?.title || "").toLowerCase();
    const matchesQuery = promptText.includes(query.toLowerCase()) || projText.includes(query.toLowerCase());
    if (!matchesQuery) return false;
    if (filter === "Favorites") return g.is_favorite;
    if (filter === "All") return true;
    const toolLower = g.tool.toLowerCase().replace("-", " ");
    const filterLower = filter.toLowerCase().replace("-", " ");
    return toolLower.includes(filterLower) || filterLower.includes(toolLower);
  });

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
      const created = await createProject.mutateAsync({
        title: draft.title.trim(),
        type: draft.type,
        description: draft.description,
      });
      if (created?.id) {
        openProjectDetail(created.id);
      }
    }
    setDraft(null);
  }

  const navigateToStudio = (type: string, projectId: string) => {
    setActiveProject(projectId);
    const path =
      type === "Interior"
        ? "/interior"
        : type === "Redesign"
          ? "/redesign"
          : type === "Floor Plan"
            ? "/floor-plan"
            : "/architecture";
    navigate({ to: path });
  };

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Projects & Generations"
        description="All your architectural concepts, room redesigns, interior renders, and floor plans in one place."
        actions={
          <Button onClick={() => setDraft({ ...emptyDraft })}>
            <Plus className="size-4" /> New project
          </Button>
        }
      />

      {/* Tabs Switcher */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            const nextTab = v as "projects" | "generations";
            setActiveTab(nextTab);
            navigate({
              to: "/projects",
              search: { id: selectedProjectId || undefined, tab: nextTab },
            });
          }}
        >
          <TabsList className="grid w-[280px] grid-cols-2">
            <TabsTrigger value="projects" className="gap-1.5 text-xs">
              <FolderKanban className="size-3.5" /> Projects ({projects.length})
            </TabsTrigger>
            <TabsTrigger value="generations" className="gap-1.5 text-xs">
              <Sparkles className="size-3.5" /> All Renders ({allGenerations.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeTab === "projects" ? "Search projects…" : "Search prompt or project…"}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(activeTab === "projects" ? filters : toolFilters).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                className="h-8 text-xs px-2.5"
                onClick={() => setFilter(f)}
              >
                {f === "Favorites" && <Heart className="size-3 mr-1 fill-current" />}
                {f}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* --- TAB 1: PROJECTS VIEW --- */}
      {activeTab === "projects" && (
        <>
          {isProjectsLoading ? (
            <div className="surface-panel grid place-items-center p-16">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>
          ) : visibleProjects.length === 0 ? (
            <div className="surface-panel p-16 text-center text-sm text-muted-foreground space-y-3">
              <FolderOpen className="mx-auto size-10 text-muted-foreground/60" />
              <p className="font-medium text-foreground">
                {projects.length === 0 ? "No projects created yet" : "No projects match your filter"}
              </p>
              <p className="max-w-md mx-auto text-xs">
                {projects.length === 0
                  ? "Create your first project or run a generation in the AI Studios to automatically start saving."
                  : "Try clearing your search query or selecting a different category filter."}
              </p>
              {projects.length === 0 && (
                <Button size="sm" onClick={() => setDraft({ ...emptyDraft })} className="mt-2">
                  <Plus className="size-4 mr-1" /> Create Project
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProjects.map((p) => {
                const cover = coverFor(p);
                const count = p.generations_count ?? 0;
                return (
                  <article
                    key={p.id}
                    className="surface-panel overflow-hidden transition-all duration-200 hover:border-primary/60 hover:shadow-md group flex flex-col justify-between"
                  >
                    <div>
                      <div
                        className="relative cursor-pointer overflow-hidden bg-secondary/30"
                        onClick={() => openProjectDetail(p.id)}
                      >
                        <img
                          src={cover}
                          alt={p.title}
                          loading="lazy"
                          className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="text-xs text-white flex items-center gap-1 font-medium">
                            <FolderOpen className="size-3.5" /> View Gallery ({count} items)
                          </span>
                        </div>

                        <Badge
                          variant="secondary"
                          className="absolute bottom-3 right-3 bg-background/90 backdrop-blur text-[10px] font-mono shadow-sm"
                        >
                          {count === 1 ? "1 item" : `${count} items`}
                        </Badge>

                        <button
                          type="button"
                          aria-label={p.is_favorite ? "Remove from favorites" : "Add to favorites"}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateProject.mutate({ id: p.id, is_favorite: !p.is_favorite });
                          }}
                          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-background/80 backdrop-blur transition-transform hover:scale-110 shadow-sm"
                        >
                          <Heart
                            className={`size-4 ${
                              p.is_favorite ? "fill-primary text-primary" : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="p-4 cursor-pointer" onClick={() => openProjectDetail(p.id)}>
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-[11px] font-semibold text-primary border-primary/30">
                            {p.type}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {relativeTime(p.updated_at)}
                          </span>
                        </div>
                        <h2 className="mt-2 text-base font-semibold truncate group-hover:text-primary transition-colors">
                          {p.title}
                        </h2>
                        {p.description && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {p.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0 border-t border-border/50 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-8 text-xs flex-1 gap-1"
                        onClick={() => openProjectDetail(p.id)}
                      >
                        <FolderOpen className="size-3.5" /> Open Project
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5"
                        title="Edit Project Details"
                        onClick={() =>
                          setDraft({
                            id: p.id,
                            title: p.title,
                            type: p.type,
                            description: p.description ?? "",
                          })
                        }
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2.5 text-muted-foreground hover:text-destructive"
                        title="Delete Project"
                        onClick={() => setPendingDelete(p)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* --- TAB 2: ALL GENERATIONS VIEW --- */}
      {activeTab === "generations" && (
        <>
          {isGenerationsLoading ? (
            <div className="surface-panel grid place-items-center p-16">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>
          ) : visibleGenerations.length === 0 ? (
            <div className="surface-panel p-16 text-center text-sm text-muted-foreground space-y-3">
              <Sparkles className="mx-auto size-10 text-muted-foreground/60" />
              <p className="font-medium text-foreground">No renders found</p>
              <p className="max-w-md mx-auto text-xs">
                {allGenerations.length === 0
                  ? "Generate concepts in Architecture, Interior, Redesign, or Floor Plan studio to build your portfolio."
                  : "Try clearing your search query or selecting 'All'."}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {visibleGenerations.map((g) => (
                <GenerationCard
                  key={g.id}
                  gen={g}
                  projects={projects}
                  onZoom={(url) => setZoomUrl(url)}
                  onSheet={(data) => setPresentationData(data)}
                  onAssign={(item) => {
                    setAssignGenTarget(item);
                    setAssignTargetProjectId(item.project_id || "");
                  }}
                  onDelete={(item) => setPendingDeleteGen(item)}
                  onToggleFavorite={(id, current) => toggleFavoriteGen.mutate({ id, isFavorite: !current })}
                  onOpenProject={(projId) => openProjectDetail(projId)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* --- PROJECT DETAIL MODAL --- */}
      {/* ========================================================================= */}
      <ProjectDetailDialog
        projectId={selectedProjectId}
        onClose={closeProjectDetail}
        onEdit={(p) =>
          setDraft({
            id: p.id,
            title: p.title,
            type: p.type,
            description: p.description ?? "",
          })
        }
        onOpenInStudio={(type, id) => navigateToStudio(type, id)}
        onZoom={(url) => setZoomUrl(url)}
        onSheet={(data) => setPresentationData(data)}
        onAssign={(item) => {
          setAssignGenTarget(item);
          setAssignTargetProjectId(item.project_id || "");
        }}
        onDeleteGen={(item) => setPendingDeleteGen(item)}
        projects={projects}
      />

      {/* --- EDIT / NEW PROJECT DIALOG --- */}
      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit project" : "New project"}</DialogTitle>
            <DialogDescription>
              Group your AI architectural concepts, interior designs, and floor plans.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={draft?.title ?? ""}
                onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                placeholder="e.g., Coastal Villa — Alibaug"
                autoFocus
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
                placeholder="Site brief, client notes, materials, design intent…"
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
                <Loader2 className="size-4 animate-spin mr-1.5" />
              )}
              {draft?.id ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- ASSIGN / MOVE GENERATION MODAL --- */}
      <Dialog open={assignGenTarget !== null} onOpenChange={(open) => !open && setAssignGenTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move / Save to Project</DialogTitle>
            <DialogDescription>
              Assign this generated render into an existing workspace project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Destination Project</Label>
              <Select
                value={assignTargetProjectId}
                onValueChange={setAssignTargetProjectId}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} ({p.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setAssignGenTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!assignTargetProjectId || assignGen.isPending}
              onClick={async () => {
                if (!assignGenTarget || !assignTargetProjectId) return;
                await assignGen.mutateAsync({
                  generationId: assignGenTarget.id,
                  projectId: assignTargetProjectId,
                  setAsCover: true,
                  imageUrl: assignGenTarget.image_url ?? undefined,
                });
                setAssignGenTarget(null);
              }}
            >
              {assignGen.isPending && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
              Assign to Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- FULLSCREEN ZOOM DIALOG --- */}
      <Dialog open={zoomUrl !== null} onOpenChange={(open) => !open && setZoomUrl(null)}>
        <DialogContent className="max-w-5xl bg-background/95 backdrop-blur p-2 sm:p-4">
          <DialogTitle className="sr-only">AI Render Preview</DialogTitle>
          {zoomUrl && (
            <div className="relative aspect-auto max-h-[85vh] w-full overflow-hidden rounded-lg grid place-items-center">
              <img
                src={zoomUrl}
                alt="AI Render Fullscreen"
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-md shadow-2xl"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- PRESENTATION SHEET MODAL --- */}
      {presentationData && (
        <PresentationSheet
          open={presentationData !== null}
          onOpenChange={(open) => !open && setPresentationData(null)}
          imageUrl={presentationData.url}
          title={presentationData.title}
          prompt={presentationData.prompt}
          tool={presentationData.tool}
          seed={presentationData.seed}
          authorName="ArchiGen Studio"
        />
      )}

      {/* --- DELETE PROJECT ALERT --- */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes this project container. All generated renders will remain safe in your "All Renders" gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) deleteProject.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- DELETE GENERATION ALERT --- */}
      <AlertDialog
        open={pendingDeleteGen !== null}
        onOpenChange={(open) => !open && setPendingDeleteGen(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this generated design?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the render and its generated image from cloud storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteGen) deleteGen.mutate(pendingDeleteGen.id);
                setPendingDeleteGen(null);
              }}
            >
              Delete Render
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// =========================================================================
// --- SUB-COMPONENT: PROJECT DETAIL DIALOG ---
// =========================================================================
function ProjectDetailDialog({
  projectId,
  onClose,
  onEdit,
  onOpenInStudio,
  onZoom,
  onSheet,
  onAssign,
  onDeleteGen,
  projects,
}: {
  projectId: string | null;
  onClose: () => void;
  onEdit: (p: ProjectRow) => void;
  onOpenInStudio: (type: string, id: string) => void;
  onZoom: (url: string) => void;
  onSheet: (data: { url: string; title: string; tool: string; prompt?: string | undefined; seed?: number | undefined }) => void;
  onAssign: (item: GenerationRow) => void;
  onDeleteGen: (item: GenerationRow) => void;
  projects: ProjectRow[];
}) {
  const { data: allProjects = [] } = useProjects();
  const project = allProjects.find((p) => p.id === projectId) ?? null;

  const { data: generations = [], isLoading } = useProjectGenerations(projectId);
  const toggleFavorite = useToggleGenerationFavorite();

  if (!projectId) return null;

  return (
    <Dialog open={projectId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-background">
        {project ? (
          <>
            <DialogHeader className="border-b border-border pb-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30">
                      {project.type} Project
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Updated {relativeTime(project.updated_at)}
                    </span>
                  </div>
                  <DialogTitle className="text-xl sm:text-2xl font-bold">{project.title}</DialogTitle>
                  {project.description && (
                    <DialogDescription className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                      {project.description}
                    </DialogDescription>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1"
                    onClick={() => onEdit(project)}
                  >
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => onOpenInStudio(project.type, project.id)}
                  >
                    <Sparkles className="size-3.5" /> Open in {project.type} Studio
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="py-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" /> Generated Concepts & Renders ({generations.length})
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Saved automatically to this project
                </span>
              </div>

              {isLoading ? (
                <div className="grid place-items-center py-16">
                  <Loader2 className="size-7 animate-spin text-primary" />
                </div>
              ) : generations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-12 text-center space-y-3 bg-secondary/10">
                  <Sparkles className="mx-auto size-8 text-muted-foreground/60" />
                  <p className="text-sm font-medium text-foreground">No concepts generated in this project yet</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Launch the {project.type} Studio to generate photorealistic architectural renders that will automatically save right here.
                  </p>
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => onOpenInStudio(project.type, project.id)}
                  >
                    <Sparkles className="size-3.5 mr-1" /> Generate First Concept
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {generations.map((gen) => (
                    <GenerationCard
                      key={gen.id}
                      gen={gen}
                      projects={projects}
                      onZoom={onZoom}
                      onSheet={onSheet}
                      onAssign={onAssign}
                      onDelete={onDeleteGen}
                      onToggleFavorite={(id, current) =>
                        toggleFavorite.mutate({ id, isFavorite: !current })
                      }
                      onOpenProject={() => {}}
                      hideProjectLink
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="grid place-items-center py-16">
            <Loader2 className="size-7 animate-spin text-primary" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// =========================================================================
// --- SUB-COMPONENT: GENERATION CARD ---
// =========================================================================
function GenerationCard({
  gen,
  projects,
  onZoom,
  onSheet,
  onAssign,
  onDelete,
  onToggleFavorite,
  onOpenProject,
  hideProjectLink = false,
}: {
  gen: GenerationRow;
  projects: ProjectRow[];
  onZoom: (url: string) => void;
  onSheet: (data: { url: string; title: string; tool: string; prompt?: string | undefined; seed?: number | undefined }) => void;
  onAssign: (item: GenerationRow) => void;
  onDelete: (item: GenerationRow) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onOpenProject: (projectId: string) => void;
  hideProjectLink?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const imageUrl = gen.image_url;

  const copyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!gen.prompt) return;
    navigator.clipboard.writeText(gen.prompt);
    setCopied(true);
    toast.success("Prompt copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const projectTitle =
    gen.project?.title ?? projects.find((p) => p.id === gen.project_id)?.title;

  const seedNum = gen.settings["seed"] !== undefined ? Number(gen.settings["seed"]) : undefined;
  const stylePresetStr = gen.settings["style_preset"] ? String(gen.settings["style_preset"]).replace(/_/g, " ") : null;

  return (
    <div className="surface-panel overflow-hidden transition-all duration-200 hover:border-primary/50 group flex flex-col justify-between">
      <div>
        {/* Render Preview Image */}
        <div className="relative aspect-square w-full overflow-hidden bg-secondary/30">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={gen.prompt || "AI Render"}
                loading="lazy"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                <div className="flex items-center justify-between">
                  <Badge className="bg-black/70 text-white border-0 text-[10px] uppercase font-mono">
                    {gen.tool}
                  </Badge>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(gen.id, gen.is_favorite);
                    }}
                    className="grid size-7 place-items-center rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors"
                  >
                    <Heart
                      className={`size-3.5 ${
                        gen.is_favorite ? "fill-primary text-primary" : "text-white"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2 text-[11px] bg-white/90 text-black hover:bg-white gap-1"
                    onClick={() => onZoom(imageUrl)}
                  >
                    <Maximize2 className="size-3" /> Zoom
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2 text-[11px] bg-white/90 text-black hover:bg-white gap-1"
                    onClick={() =>
                      onSheet({
                        url: imageUrl,
                        title: `${gen.tool.charAt(0).toUpperCase() + gen.tool.slice(1)} Concept`,
                        tool: gen.tool,
                        prompt: gen.prompt || undefined,
                        seed: seedNum,
                      })
                    }
                  >
                    <FileText className="size-3" /> Sheet
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="grid size-full place-items-center p-4 text-center bg-secondary/20">
              <div className="space-y-1">
                <Layers className="mx-auto size-8 text-muted-foreground/60" />
                <p className="text-xs font-semibold">{gen.tool.toUpperCase()}</p>
                <p className="text-[10px] text-muted-foreground">Floor Plan Vector</p>
              </div>
            </div>
          )}
        </div>

        {/* Card Info */}
        <div className="p-3 space-y-1.5">
          {!hideProjectLink && (
            <div className="flex items-center justify-between text-[10px]">
              {gen.project_id ? (
                <button
                  type="button"
                  onClick={() => onOpenProject(gen.project_id!)}
                  className="text-primary hover:underline flex items-center gap-1 font-medium truncate max-w-[170px]"
                >
                  <FolderKanban className="size-3 shrink-0" />
                  <span className="truncate">{projectTitle ?? "Project"}</span>
                </button>
              ) : (
                <span className="text-muted-foreground flex items-center gap-1">
                  <FolderKanban className="size-3" /> Unassigned
                </span>
              )}
              <span className="text-muted-foreground">{relativeTime(gen.created_at)}</span>
            </div>
          )}

          <p className="text-xs text-foreground line-clamp-2 leading-relaxed" title={gen.prompt || ""}>
            {gen.prompt || "Concept generation"}
          </p>

          {(stylePresetStr || seedNum !== undefined) && (
            <div className="flex items-center gap-1 flex-wrap pt-0.5">
              {stylePresetStr && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground">
                  {stylePresetStr}
                </Badge>
              )}
              {seedNum !== undefined && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono text-muted-foreground">
                  seed:{seedNum}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="p-3 pt-0 border-t border-border/40 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          {gen.prompt && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              title="Copy Brief"
              onClick={copyPrompt}
            >
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
            </Button>
          )}
          {imageUrl && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" asChild>
              <a href={imageUrl} download="archigen-render.png" target="_blank" rel="noreferrer">
                <Download className="size-3" />
              </a>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10 gap-1"
            onClick={() => onAssign(gen)}
          >
            <FolderKanban className="size-3" /> Project
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-1.5 text-muted-foreground hover:text-destructive"
            title="Delete generation"
            onClick={() => onDelete(gen)}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
