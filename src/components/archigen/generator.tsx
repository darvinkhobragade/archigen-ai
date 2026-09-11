import { useState, useEffect, type ReactNode } from "react";
import {
  Loader2,
  Sparkles,
  Download,
  Heart,
  RefreshCw,
  Maximize2,
  SlidersHorizontal,
  Copy,
  Check,
  Wand2,
  Sun,
  Camera,
  Lock,
  Unlock,
  Shuffle,
  Layers,
  FileText,
  FolderKanban,
  FolderPlus,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PresentationSheet } from "@/components/archigen/presentation-sheet";
import { CONCEPTUAL_NOTE } from "@/lib/archigen-data";
import { supabase } from "@/integrations/supabase/client";
import { useGenerateDesign, useEnhancePrompt } from "@/hooks/use-generate";
import { useProfile } from "@/hooks/use-profile";
import { useAppSettings } from "@/hooks/use-app-settings";
import {
  useProjects,
  useActiveProject,
  useCreateProject,
  useAssignGenerationToProject,
  mapToolToProjectType,
  type ProjectType,
} from "@/hooks/use-projects";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="label-caps">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold md:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions}
    </div>
  );
}

export type GenerationRequest = {
  prompt: string;
  settings: Record<string, string | number>;
  stylePreset?: string;
  aspectRatio?: string;
  lightingMood?: string;
  cameraAngle?: string;
  seed?: number;
  sourceImage?: string | null;
};

export function GeneratorCanvas({
  tool,
  cost,
  previewAlt,
  buildRequest,
  children,
  sourceImage,
}: {
  tool: "architecture" | "interior" | "redesign";
  cost: number;
  previewAlt: string;
  buildRequest: () => GenerationRequest | string;
  children: ReactNode;
  sourceImage?: string | null;
}) {
  const { settings: appSettings } = useAppSettings();
  const { data: projects = [] } = useProjects();
  const { activeProjectId, setActiveProject } = useActiveProject();

  const targetType = mapToolToProjectType(tool);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => activeProjectId);

  // Sync if activeProjectId changes externally
  useEffect(() => {
    if (activeProjectId && projects.some((p) => p.id === activeProjectId)) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId, projects]);

  const [result, setResult] = useState<{
    id: string;
    url: string;
    prompt?: string;
    seed?: number;
    projectId?: string | null;
  } | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [stylePreset, setStylePreset] = useState<string>("photorealistic");
  const [lightingMood, setLightingMood] = useState<string>("natural_daylight");
  const [cameraAngle, setCameraAngle] = useState<string>(
    tool === "interior" ? "interior_wide" : "eye_level",
  );
  const [seedVal, setSeedVal] = useState<number | "">("");
  const [lockSeed, setLockSeed] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [copied, setCopied] = useState(false);

  // Project management modals
  const [newProjModalOpen, setNewProjModalOpen] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveToProjectId, setMoveToProjectId] = useState<string>("");

  const createProject = useCreateProject();
  const assignGen = useAssignGenerationToProject();
  const generation = useGenerateDesign();
  const { data: profile } = useProfile();
  const credits = profile?.credits ?? 0;
  const canAfford = credits >= cost;

  const handleCreateInlineProject = async () => {
    if (!newProjTitle.trim()) return;
    const res = await createProject.mutateAsync({
      title: newProjTitle.trim(),
      type: targetType,
      description: `Project for ${targetType} designs`,
    });
    if (res?.id) {
      setSelectedProjectId(res.id);
      setActiveProject(res.id);
      setNewProjTitle("");
      setNewProjModalOpen(false);
    }
  };

  const generate = async () => {
    if (!canAfford) {
      toast.error("Not enough credits", { description: `This action needs ${cost} credits.` });
      return;
    }
    const request = buildRequest();
    if (typeof request === "string") {
      toast.error(request);
      return;
    }

    const currentSeed = lockSeed && typeof seedVal === "number" ? seedVal : undefined;

    const data = await generation.mutateAsync({
      tool,
      cost,
      prompt: request.prompt,
      settings: {
        ...request.settings,
        watermark: appSettings.watermark ? "true" : "false",
      },
      stylePreset: request.stylePreset || stylePreset,
      aspectRatio: request.aspectRatio || aspectRatio,
      lightingMood: request.lightingMood || lightingMood,
      cameraAngle: request.cameraAngle || cameraAngle,
      seed: currentSeed,
      projectId: selectedProjectId || undefined,
      sourceImage: request.sourceImage ?? sourceImage ?? null,
    });

    setResult({
      id: data.id,
      url: data.url,
      prompt: request.prompt,
      seed: data.seed,
      projectId: data.projectId ?? selectedProjectId,
    });

    if (data.projectId && !selectedProjectId) {
      setSelectedProjectId(data.projectId);
      setActiveProject(data.projectId);
    }

    if (!lockSeed) {
      setSeedVal(data.seed);
    }
    setFavorite(false);

    const savedProject = projects.find((p) => p.id === (data.projectId || selectedProjectId));
    const projectLabel = savedProject ? ` · saved to "${savedProject.title}"` : " · saved to Projects";

    toast.success("High-fidelity concept rendered", {
      description: `${cost} credits used${projectLabel}.`,
    });
  };

  const toggleFavorite = async () => {
    if (!result) return;
    const next = !favorite;
    setFavorite(next);
    const { error } = await supabase
      .from("generations")
      .update({ is_favorite: next })
      .eq("id", result.id);
    if (error) {
      setFavorite(!next);
      toast.error(error.message);
      return;
    }
    toast(next ? "Added to favorites" : "Removed from favorites");
  };

  const copyPrompt = () => {
    if (!result?.prompt) return;
    navigator.clipboard.writeText(result.prompt);
    setCopied(true);
    toast.success("Prompt copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const isBusy = generation.isPending;

  const aspectClass =
    aspectRatio === "16:9"
      ? "aspect-[16/9]"
      : aspectRatio === "4:3"
        ? "aspect-[4/3]"
        : aspectRatio === "9:16"
          ? "aspect-[9/16]"
          : aspectRatio === "3:2"
            ? "aspect-[3/2]"
            : "aspect-square";

  const currentProject = projects.find(
    (p) => p.id === (result?.projectId || selectedProjectId),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <section className="surface-panel space-y-5 p-6">
        {/* Active Target Project Selector */}
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <FolderKanban className="size-3.5 text-primary" /> Save to Project
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[11px] text-primary hover:bg-primary/10 gap-1"
              onClick={() => setNewProjModalOpen(true)}
            >
              <FolderPlus className="size-3" /> New Project
            </Button>
          </div>
          <Select
            value={selectedProjectId || "auto"}
            onValueChange={(val) => {
              if (val === "auto") {
                setSelectedProjectId(null);
                setActiveProject(null);
              } else {
                setSelectedProjectId(val);
                setActiveProject(val);
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-background">
              <SelectValue placeholder="Auto-save to project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">⚡ Auto-create / Latest {targetType} Project</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title} ({p.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProjectId ? (
            <p className="text-[10px] text-muted-foreground flex items-center justify-between">
              <span className="truncate">
                Saving to:{" "}
                <strong className="text-foreground">
                  {projects.find((p) => p.id === selectedProjectId)?.title ?? "Selected Project"}
                </strong>
              </span>
              <Link
                to="/projects"
                search={{ id: selectedProjectId || undefined, tab: "projects" }}
                className="text-primary hover:underline ml-2 shrink-0 inline-flex items-center gap-0.5 font-medium"
              >
                Open <ArrowUpRight className="size-2.5" />
              </Link>
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              {appSettings.autosave
                ? `Autosave on: renders automatically save into a "${targetType}" project.`
                : "Concepts will be saved into your workspace projects."}
            </p>
          )}
        </div>

        {children}

        {/* Precision AI Controls */}
        <div className="space-y-4 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <SlidersHorizontal className="size-3.5" /> Architectural Model Controls
            </Label>
            <Badge
              variant="outline"
              className="text-[10px] tracking-wide uppercase text-primary border-primary/30"
            >
              Photorealistic Engine
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Layers className="size-3 text-muted-foreground" /> Style Preset
              </Label>
              <Select value={stylePreset} onValueChange={setStylePreset}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photorealistic">Photorealistic 8K</SelectItem>
                  <SelectItem value="archdaily">ArchDaily Editorial</SelectItem>
                  <SelectItem value="biophilic">Biophilic Contemporary</SelectItem>
                  <SelectItem value="japandi">Japandi Wabi-Sabi</SelectItem>
                  <SelectItem value="brutalist">Brutalist Raw Concrete</SelectItem>
                  <SelectItem value="tropical_modern">Tropical Modern (Villa)</SelectItem>
                  <SelectItem value="luxury_penthouse">Ultra-Luxury Penthouse</SelectItem>
                  <SelectItem value="golden_hour">Golden Hour Sunset</SelectItem>
                  <SelectItem value="moody_night">Cinematic Blue Hour</SelectItem>
                  <SelectItem value="minimal_clean">Minimal Scandinavian</SelectItem>
                  <SelectItem value="sketch_render">Architectural Sketch Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Sun className="size-3 text-muted-foreground" /> Lighting & Mood
              </Label>
              <Select value={lightingMood} onValueChange={setLightingMood}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="natural_daylight">Natural Daylight (5500K)</SelectItem>
                  <SelectItem value="golden_hour">Golden Hour (3200K)</SelectItem>
                  <SelectItem value="blue_hour">Blue Hour Dusk</SelectItem>
                  <SelectItem value="dramatic_night">Dramatic Night View</SelectItem>
                  <SelectItem value="soft_overcast">Soft Overcast Diffused</SelectItem>
                  <SelectItem value="foggy_morning">Atmospheric Morning Haze</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Camera className="size-3 text-muted-foreground" /> Camera Angle
              </Label>
              <Select value={cameraAngle} onValueChange={setCameraAngle}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eye_level">Eye-Level 35mm</SelectItem>
                  <SelectItem value="tilt_shift_wide">24mm Tilt-Shift (Zero Keystone)</SelectItem>
                  <SelectItem value="interior_wide">18mm Interior Wide Angle</SelectItem>
                  <SelectItem value="isometric_axonometric">3D Axonometric Isometric</SelectItem>
                  <SelectItem value="aerial_drone">Aerial Drone Site View</SelectItem>
                  <SelectItem value="macro_detail">Macro Detail Joinery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1">Seed (Geometry Lock)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1 text-[10px] text-muted-foreground hover:text-foreground"
                  onClick={() => setLockSeed(!lockSeed)}
                >
                  {lockSeed ? (
                    <span className="flex items-center gap-0.5 text-primary font-medium">
                      <Lock className="size-2.5" /> Locked
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5">
                      <Unlock className="size-2.5" /> Random
                    </span>
                  )}
                </Button>
              </div>
              <div className="flex gap-1.5">
                <Input
                  type="number"
                  placeholder="Auto (Random)"
                  value={seedVal}
                  onChange={(e) => {
                    const v = e.target.value === "" ? "" : parseInt(e.target.value, 10);
                    setSeedVal(isNaN(v as number) ? "" : v);
                  }}
                  className="h-8 text-xs font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2"
                  title="Randomize Seed"
                  onClick={() => {
                    const r = Math.floor(Math.random() * 1000000);
                    setSeedVal(r);
                    toast("New seed randomized: " + r);
                  }}
                >
                  <Shuffle className="size-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Aspect Ratio & Canvas Framing</Label>
            <div className="grid grid-cols-5 gap-1">
              {(["1:1", "16:9", "4:3", "9:16", "3:2"] as const).map((ratio) => (
                <Button
                  key={ratio}
                  type="button"
                  variant={aspectRatio === ratio ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-1 text-[11px] font-mono"
                  onClick={() => setAspectRatio(ratio)}
                >
                  {ratio}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {!canAfford && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <p className="font-medium text-destructive">Not enough credits</p>
            <p className="mt-1 text-muted-foreground">
              You have {credits} — this needs {cost}.{" "}
              <Link to="/pricing" className="text-primary underline underline-offset-4">
                Top up
              </Link>
            </p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="label-caps">
            Cost {cost} credits · {credits} left
          </span>
          <Button onClick={generate} disabled={isBusy || !canAfford}>
            {isBusy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Rendering…
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Generate AI Render
              </>
            )}
          </Button>
        </div>
      </section>

      <section className="surface-panel overflow-hidden flex flex-col">
        {result && (
          <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/30 px-4 py-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground truncate">
              <FolderKanban className="size-3.5 text-primary shrink-0" />
              <span className="truncate">
                Saved in:{" "}
                <strong className="text-foreground">
                  {currentProject?.title ?? "Workspace Project"}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {result.projectId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px] text-primary hover:text-primary gap-1"
                  asChild
                >
                  <Link to="/projects" search={{ id: result.projectId, tab: "projects" }}>
                    View in Projects <ArrowUpRight className="size-3" />
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[11px] gap-1"
                onClick={() => {
                  setMoveToProjectId(result.projectId || selectedProjectId || "");
                  setMoveModalOpen(true);
                }}
              >
                Change Project
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-[380px] grid place-items-center p-4 bg-secondary/20 blueprint-grid">
          <div
            className={`relative w-full max-w-2xl max-h-[560px] overflow-hidden rounded-lg border border-border shadow-sm bg-background ${aspectClass}`}
          >
            {result && !isBusy ? (
              sourceImage ? (
                /* Before / After Slider View for Image-to-Image / Room Redesign */
                <div
                  className="relative size-full select-none cursor-ew-resize overflow-hidden"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                    setSliderPos((x / rect.width) * 100);
                  }}
                  onTouchMove={(e) => {
                    const touch = e.touches[0];
                    if (!touch) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
                    setSliderPos((x / rect.width) * 100);
                  }}
                >
                  <img
                    src={result.url}
                    alt={previewAlt}
                    className="absolute inset-0 size-full object-cover contrast-[1.03] saturate-[1.02]"
                  />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                      clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                    }}
                  >
                    <img
                      src={sourceImage}
                      alt="Original Photo"
                      className="absolute inset-0 size-full object-cover contrast-[1.03] saturate-[1.02]"
                    />
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-6 rounded-full bg-white text-black shadow-md grid place-items-center text-[10px] font-bold">
                      ↔
                    </div>
                  </div>
                  <Badge className="absolute top-3 left-3 z-10 bg-black/70 text-white border-0 text-[10px]">
                    Before (Original)
                  </Badge>
                  <Badge className="absolute top-3 right-3 z-10 bg-primary/90 text-primary-foreground border-0 text-[10px]">
                    After (AI Remodel)
                  </Badge>
                </div>
              ) : (
                <div className="relative size-full group">
                  <img
                    src={result.url}
                    alt={previewAlt}
                    loading="lazy"
                    className="size-full object-cover contrast-[1.03] saturate-[1.02]"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur"
                    onClick={() => setZoomOpen(true)}
                  >
                    <Maximize2 className="size-4" />
                  </Button>
                  {result.seed && (
                    <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge
                        variant="secondary"
                        className="bg-background/80 backdrop-blur text-[10px] font-mono"
                      >
                        Seed: {result.seed}
                      </Badge>
                    </div>
                  )}
                </div>
              )
            ) : (
              <div className="grid size-full place-items-center p-6 text-center">
                {isBusy ? (
                  <div className="space-y-3">
                    <Loader2 className="mx-auto size-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      Rendering Photorealistic Concept…
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Synthesizing lighting physics, materials & spatial geometry
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-w-sm">
                    <Wand2 className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="text-sm text-muted-foreground">
                      Specify design parameters and click{" "}
                      <span className="font-semibold text-foreground">Generate AI Render</span> to
                      synthesize high-resolution concepts.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
          <Badge variant="outline" className="text-muted-foreground text-xs">
            {CONCEPTUAL_NOTE}
          </Badge>
          <div className="flex flex-wrap gap-2">
            {result?.prompt && (
              <Button variant="ghost" size="sm" onClick={copyPrompt}>
                {copied ? (
                  <Check className="size-4 text-emerald-500" />
                ) : (
                  <Copy className="size-4" />
                )}{" "}
                Copy Brief
              </Button>
            )}
            <Button variant="ghost" size="sm" disabled={!result || isBusy} onClick={toggleFavorite}>
              <Heart className={`size-4 ${favorite ? "fill-primary text-primary" : ""}`} /> Favorite
            </Button>
            <Button variant="ghost" size="sm" disabled={isBusy || !canAfford} onClick={generate}>
              <RefreshCw className="size-4" /> Regenerate
            </Button>

            {result && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setZoomOpen(true)}>
                  <Maximize2 className="size-4" /> Zoom
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSheetOpen(true)}>
                  <FileText className="size-4" /> Presentation Sheet
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMoveToProjectId(result.projectId || selectedProjectId || "");
                    setMoveModalOpen(true);
                  }}
                >
                  <FolderKanban className="size-4" /> Project
                </Button>
              </>
            )}

            <Button variant="outline" size="sm" disabled={!result || isBusy} asChild={!!result}>
              {result ? (
                <a
                  href={result.url}
                  download="archigen-concept.png"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="size-4" /> Download
                </a>
              ) : (
                <span>
                  <Download className="size-4" /> Download
                </span>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Fullscreen Image Preview Dialog */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-5xl bg-background/95 backdrop-blur p-2 sm:p-4">
          <DialogTitle className="sr-only">AI Render Preview</DialogTitle>
          {result && (
            <div className="relative aspect-auto max-h-[85vh] w-full overflow-hidden rounded-lg grid place-items-center">
              <img
                src={result.url}
                alt={previewAlt}
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-md shadow-2xl"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Architectural Presentation Sheet Modal */}
      {result && (
        <PresentationSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          imageUrl={result.url}
          title={`${tool.charAt(0).toUpperCase() + tool.slice(1)} Concept Design`}
          prompt={result.prompt}
          tool={tool}
          stylePreset={stylePreset}
          lightingMood={lightingMood}
          aspectRatio={aspectRatio}
          seed={result.seed}
          authorName={profile?.full_name ?? "ArchiGen Studio"}
        />
      )}

      {/* Create New Project Dialog */}
      <Dialog open={newProjModalOpen} onOpenChange={setNewProjModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new {targetType} project to save and organize your AI concepts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inline-proj-title">Project Title</Label>
              <Input
                id="inline-proj-title"
                value={newProjTitle}
                onChange={(e) => setNewProjTitle(e.target.value)}
                placeholder={`e.g., Luxury Villa ${targetType}`}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNewProjModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newProjTitle.trim() || createProject.isPending}
              onClick={handleCreateInlineProject}
            >
              {createProject.isPending && <Loader2 className="size-3.5 animate-spin" />}
              Create & Set Active
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move/Assign Generation Dialog */}
      <Dialog open={moveModalOpen} onOpenChange={setMoveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save to Another Project</DialogTitle>
            <DialogDescription>
              Select an existing workspace project to organize this concept.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Destination Project</Label>
              <Select value={moveToProjectId} onValueChange={setMoveToProjectId}>
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
            <Button variant="outline" size="sm" onClick={() => setMoveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!moveToProjectId || assignGen.isPending}
              onClick={async () => {
                if (!result?.id || !moveToProjectId) return;
                await assignGen.mutateAsync({
                  generationId: result.id,
                  projectId: moveToProjectId,
                  setAsCover: true,
                  imageUrl: result.url,
                });
                setResult((r) => (r ? { ...r, projectId: moveToProjectId } : null));
                setSelectedProjectId(moveToProjectId);
                setActiveProject(moveToProjectId);
                setMoveModalOpen(false);
              }}
            >
              {assignGen.isPending && <Loader2 className="size-3.5 animate-spin" />}
              Save to Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PromptEnhancerButton({
  brief,
  tool,
  onEnhanced,
}: {
  brief: string;
  tool: string;
  onEnhanced: (enhancedText: string) => void;
}) {
  const enhance = useEnhancePrompt();

  const handleEnhance = async () => {
    if (!brief.trim()) {
      toast.error("Please enter a short brief first.");
      return;
    }
    const res = await enhance.mutateAsync({ brief, tool });
    if (res?.enhanced) {
      onEnhanced(res.enhanced);
      toast.success("Brief expanded with architectural details!");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1"
      onClick={handleEnhance}
      disabled={enhance.isPending}
    >
      {enhance.isPending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Wand2 className="size-3" />
      )}
      AI Enhance Brief
    </Button>
  );
}
