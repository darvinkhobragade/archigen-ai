import { useState, type ReactNode } from "react";
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
  Ruler,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PresentationSheet } from "@/components/archigen/presentation-sheet";
import { CONCEPTUAL_NOTE } from "@/lib/archigen-data";
import { supabase } from "@/integrations/supabase/client";
import { useGenerateDesign, useEnhancePrompt } from "@/hooks/use-generate";
import { useProfile } from "@/hooks/use-profile";
import { useAppSettings } from "@/hooks/use-app-settings";
import { Link } from "@tanstack/react-router";

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
  const [result, setResult] = useState<{
    id: string;
    url: string;
    prompt?: string;
    seed?: number;
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

  const generation = useGenerateDesign();
  const { data: profile } = useProfile();
  const credits = profile?.credits ?? 0;
  const effectiveCost = appSettings.hires ? cost + 1 : cost;
  const canAfford = credits >= effectiveCost;

  const generate = async () => {
    if (!canAfford) {
      toast.error("Not enough credits", { description: `This action needs ${effectiveCost} credits.` });
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
      cost: effectiveCost,
      prompt: request.prompt,
      settings: {
        ...request.settings,
        hires: appSettings.hires ? "true" : "false",
        watermark: appSettings.watermark ? "true" : "false",
      },
      stylePreset: request.stylePreset || stylePreset,
      aspectRatio: request.aspectRatio || aspectRatio,
      lightingMood: request.lightingMood || lightingMood,
      cameraAngle: request.cameraAngle || cameraAngle,
      seed: currentSeed,
      sourceImage: request.sourceImage ?? sourceImage ?? null,
    });

    setResult({ id: data.id, url: data.url, prompt: request.prompt, seed: data.seed });
    if (!lockSeed) {
      setSeedVal(data.seed);
    }
    setFavorite(false);
    const autoSaveDesc = appSettings.autosave ? " · saved to active project" : "";
    toast.success("High-fidelity concept rendered", {
      description: `${effectiveCost} credits used${appSettings.hires ? " (8K UHD)" : ""}${autoSaveDesc}.`,
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

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <section className="surface-panel space-y-5 p-6">
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
              You have {credits} — this needs {effectiveCost}.{" "}
              <Link to="/pricing" className="text-primary underline underline-offset-4">
                Top up
              </Link>
            </p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="label-caps">
            Cost {effectiveCost} credits {appSettings.hires ? "(8K HD)" : ""} · {credits} left
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
                  {appSettings.watermark && (
                    <div className="absolute top-3 left-3 z-10 pointer-events-none">
                      <div className="flex items-center gap-1.5 rounded bg-black/75 backdrop-blur px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-white/95 border border-white/10 shadow-md">
                        <Ruler className="size-3 text-primary" />
                        <span>ArchiGen AI · Conceptual</span>
                      </div>
                    </div>
                  )}
                  {appSettings.hires && (
                    <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
                      <Badge className="bg-primary/90 text-primary-foreground font-mono text-[9px] uppercase tracking-wider shadow-sm">
                        8K UHD
                      </Badge>
                    </div>
                  )}
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
