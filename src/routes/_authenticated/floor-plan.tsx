import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  ZoomIn,
  ZoomOut,
  Compass,
  Box,
  Move,
  Maximize2,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PageHeader } from "@/components/archigen/generator";
import { CONCEPTUAL_NOTE } from "@/lib/archigen-data";
import { useGenerateFloorPlan, useRender3DFloorPlan } from "@/hooks/use-generate";
import { useProfile } from "@/hooks/use-profile";
import { useDeleteFloorPlan, useFloorPlans, useSaveFloorPlan } from "@/hooks/use-floor-plans";
import type { PlanRoom } from "@/lib/archigen.functions";

export const Route = createFileRoute("/_authenticated/floor-plan")({
  head: () => ({
    meta: [
      { title: "Floor Plan Studio — ArchiGen AI" },
      {
        name: "description",
        content:
          "CAD-quality conceptual 1–4 BHK floor plans with Vastu analysis and 3D isometric visualization.",
      },
      { property: "og:title", content: "Floor Plan Studio — ArchiGen AI" },
      {
        property: "og:description",
        content: "Interactive CAD blueprint floor plans with Vastu intelligence.",
      },
    ],
  }),
  component: FloorPlanPage,
});

type Room = PlanRoom;

type RoomType =
  | "living"
  | "master_bedroom"
  | "bedroom"
  | "kitchen"
  | "dining"
  | "bathroom"
  | "balcony"
  | "pooja"
  | "foyer"
  | "utility";

const ROOM_THEMES: Record<
  RoomType,
  {
    bg: string;
    border: string;
    text: string;
    label: string;
  }
> = {
  living: {
    bg: "rgba(16, 185, 129, 0.12)",
    border: "#059669",
    text: "#065f46",
    label: "Living & Lounge",
  },
  master_bedroom: {
    bg: "rgba(99, 102, 241, 0.14)",
    border: "#4f46e5",
    text: "#3730a3",
    label: "Master Suite",
  },
  bedroom: {
    bg: "rgba(59, 130, 246, 0.12)",
    border: "#2563eb",
    text: "#1e40af",
    label: "Bedroom",
  },
  kitchen: {
    bg: "rgba(245, 158, 11, 0.14)",
    border: "#d97706",
    text: "#92400e",
    label: "Kitchen",
  },
  dining: {
    bg: "rgba(251, 146, 60, 0.12)",
    border: "#ea580c",
    text: "#9a3412",
    label: "Dining Hall",
  },
  bathroom: {
    bg: "rgba(6, 182, 212, 0.14)",
    border: "#0891b2",
    text: "#155e75",
    label: "Bathroom / WC",
  },
  balcony: {
    bg: "rgba(132, 204, 22, 0.12)",
    border: "#65a30d",
    text: "#3f6212",
    label: "Balcony / Deck",
  },
  pooja: {
    bg: "rgba(234, 179, 8, 0.18)",
    border: "#ca8a04",
    text: "#854d0e",
    label: "Pooja Mandir",
  },
  foyer: {
    bg: "rgba(168, 85, 247, 0.12)",
    border: "#9333ea",
    text: "#6b21a8",
    label: "Entrance Foyer",
  },
  utility: {
    bg: "rgba(20, 184, 166, 0.12)",
    border: "#0d9488",
    text: "#115e59",
    label: "Utility & Wash",
  },
};

function inferRoomType(name: string): RoomType {
  const n = name.toLowerCase();
  if (n.includes("master")) return "master_bedroom";
  if (n.includes("living") || n.includes("hall") || n.includes("lounge")) return "living";
  if (n.includes("kitchen")) return "kitchen";
  if (n.includes("dining")) return "dining";
  if (n.includes("bath") || n.includes("toilet") || n.includes("wc")) return "bathroom";
  if (n.includes("balcony") || n.includes("deck") || n.includes("sitout") || n.includes("terrace"))
    return "balcony";
  if (n.includes("pooja") || n.includes("mandir") || n.includes("prayer")) return "pooja";
  if (n.includes("foyer") || n.includes("entry") || n.includes("lobby")) return "foyer";
  if (n.includes("utility") || n.includes("wash") || n.includes("store")) return "utility";
  return "bedroom";
}

const templates: { name: string; bhk: number; plot: string; rooms: Room[] }[] = [
  {
    name: "1 BHK Compact",
    bhk: 1,
    plot: "25 x 30 ft",
    rooms: [
      { id: "r1", name: "Living & Dining", type: "living", x: 0, y: 0, w: 14, h: 16 },
      { id: "r2", name: "Master Bedroom", type: "master_bedroom", x: 14, y: 0, w: 11, h: 16 },
      { id: "r3", name: "Modular Kitchen", type: "kitchen", x: 0, y: 16, w: 10, h: 14 },
      { id: "r4", name: "Bathroom", type: "bathroom", x: 10, y: 16, w: 6, h: 14 },
      { id: "r5", name: "Sitout Balcony", type: "balcony", x: 16, y: 16, w: 9, h: 14 },
    ],
  },
  {
    name: "2 BHK Vastu Standard",
    bhk: 2,
    plot: "30 x 40 ft",
    rooms: [
      { id: "r1", name: "Living & Foyer", type: "living", x: 0, y: 0, w: 16, h: 18 },
      { id: "r2", name: "Modular Kitchen", type: "kitchen", x: 16, y: 0, w: 10, h: 18 },
      { id: "r3", name: "Utility", type: "utility", x: 26, y: 0, w: 4, h: 18 },
      { id: "r4", name: "Master Bedroom", type: "master_bedroom", x: 0, y: 18, w: 12, h: 22 },
      { id: "r5", name: "Master Bath", type: "bathroom", x: 12, y: 18, w: 4, h: 11 },
      { id: "r6", name: "Common Bath", type: "bathroom", x: 12, y: 29, w: 4, h: 11 },
      { id: "r7", name: "Bedroom 2", type: "bedroom", x: 16, y: 18, w: 14, h: 16 },
      { id: "r8", name: "Sitout Balcony", type: "balcony", x: 16, y: 34, w: 14, h: 6 },
    ],
  },
  {
    name: "3 BHK Luxury Villa",
    bhk: 3,
    plot: "30 x 50 ft",
    rooms: [
      { id: "r1", name: "Formal Living", type: "living", x: 0, y: 0, w: 18, h: 16 },
      { id: "r2", name: "Dining & Pooja", type: "pooja", x: 18, y: 0, w: 12, h: 16 },
      { id: "r3", name: "Chef Kitchen", type: "kitchen", x: 18, y: 16, w: 12, h: 17 },
      { id: "r4", name: "Dry Utility", type: "utility", x: 18, y: 33, w: 12, h: 17 },
      { id: "r5", name: "Master Suite", type: "master_bedroom", x: 0, y: 16, w: 12, h: 34 },
      { id: "r6", name: "Master Bath", type: "bathroom", x: 12, y: 16, w: 6, h: 9 },
      { id: "r7", name: "Bedroom 2", type: "bedroom", x: 12, y: 25, w: 6, h: 12 },
      { id: "r8", name: "Bedroom 3", type: "bedroom", x: 12, y: 37, w: 6, h: 13 },
    ],
  },
];

const defaultRooms: Room[] = templates[1]!.rooms;

function FloorPlanPage() {
  const [rooms, setRooms] = useState<Room[]>(defaultRooms);
  const [selected, setSelected] = useState<string | null>("r1");
  const [zoom, setZoom] = useState(1);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState("2 BHK Vastu Standard");

  const [brief, setBrief] = useState("");
  const [bhk, setBhk] = useState(2);
  const [plot, setPlot] = useState("30 x 40 ft");
  const [style3D, setStyle3D] = useState("photorealistic");
  const [render3DOpen, setRender3DOpen] = useState(false);
  const [render3DResult, setRender3DResult] = useState<string | null>(null);

  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{
    x: number;
    y: number;
    roomX: number;
    roomY: number;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const queryClient = useQueryClient();
  const generate = useGenerateFloorPlan();
  const render3D = useRender3DFloorPlan();
  const { data: creditProfile } = useProfile();
  const canAffordPlan = (creditProfile?.credits ?? 0) >= 5;
  const canAfford3D = (creditProfile?.credits ?? 0) >= 4;
  const savePlan = useSaveFloorPlan();
  const deletePlan = useDeleteFloorPlan();
  const { data: savedPlans = [], isLoading: plansLoading } = useFloorPlans();

  const selectedRoom = rooms.find((r) => r.id === selected) ?? null;
  const totalArea = rooms.reduce((sum, r) => sum + r.w * r.h, 0);

  // Bounding box calculation for plot auto-scaling
  const maxX = useMemo(() => Math.max(30, ...rooms.map((r) => r.x + r.w)), [rooms]);
  const maxY = useMemo(() => Math.max(30, ...rooms.map((r) => r.y + r.h)), [rooms]);

  // Vastu Compliance Score Calculation
  const vastuScore = useMemo(() => {
    let score = 0;
    let items = 0;

    for (const r of rooms) {
      const type = r.type || inferRoomType(r.name);
      const isSouth = r.y + r.h / 2 > maxY * 0.45;
      const isWest = r.x + r.w / 2 < maxX * 0.55;
      const isEast = r.x + r.w / 2 > maxX * 0.45;
      const isNorth = r.y + r.h / 2 < maxY * 0.55;

      if (type === "master_bedroom") {
        items++;
        if (isSouth && isWest)
          score += 100; // SW Ideal
        else if (isSouth) score += 70;
        else score += 40;
      }
      if (type === "kitchen") {
        items++;
        if (isSouth && isEast)
          score += 100; // SE Agni Ideal
        else if (isNorth && isWest)
          score += 80; // NW Alternative
        else score += 50;
      }
      if (type === "pooja") {
        items++;
        if (isNorth && isEast)
          score += 100; // NE Ishanya Ideal
        else if (isNorth) score += 80;
        else score += 45;
      }
      if (type === "living") {
        items++;
        if (isNorth || isEast) score += 95;
        else score += 70;
      }
    }
    return items > 0 ? Math.round(score / items) : 88;
  }, [rooms, maxX, maxY]);

  const update = (patch: Partial<Room>) =>
    setRooms((prev) => prev.map((r) => (r.id === selected ? { ...r, ...patch } : r)));

  const addRoom = () => {
    const id = `r${Date.now()}`;
    const newRoom: Room = {
      id,
      name: "New Bedroom",
      type: "bedroom",
      x: 0,
      y: 0,
      w: 12,
      h: 10,
    };
    setRooms((prev) => [...prev, newRoom]);
    setSelected(id);
  };

  const removeRoom = () => {
    if (!selected) return;
    setRooms((prev) => prev.filter((r) => r.id !== selected));
    setSelected(null);
  };

  const runGenerate = () => {
    generate.mutate(
      { brief, bhk, plot },
      {
        onSuccess: (res) => {
          const typedRooms = res.rooms.map((r) => ({
            ...r,
            type: r.type || inferRoomType(r.name),
          }));
          setRooms(typedRooms);
          setSelected(typedRooms[0]?.id ?? null);
          setPlanId(null);
          setPlanName(`${bhk} BHK — ${plot}`);
          queryClient.invalidateQueries({ queryKey: ["floor-plans"] });
          toast.success("Conceptual Vastu plan generated", {
            description: "Refine layout and preview in 3D.",
          });
        },
      },
    );
  };

  const handleSave = () =>
    savePlan.mutate(
      { id: planId, name: planName.trim() || "Untitled plan", rooms },
      { onSuccess: (id) => setPlanId(id) },
    );

  const handleRender3D = async () => {
    if (!canAfford3D) {
      toast.error("Not enough credits", {
        description: "3D Isometric cutaway render requires 4 credits.",
      });
      return;
    }
    setRender3DOpen(true);
    setRender3DResult(null);

    const res = await render3D.mutateAsync({
      rooms,
      bhk,
      plot,
      stylePreset: style3D,
    });
    if (res?.url) {
      setRender3DResult(res.url);
      toast.success("3D Isometric cutaway rendered!");
    }
  };

  const exportSvg = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(planName || "floor-plan").replace(/\s+/g, "-").toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CAD Blueprint exported as SVG");
  };

  // Dragging event handlers on canvas
  const handlePointerDown = (e: React.PointerEvent<SVGGElement>, r: Room) => {
    e.stopPropagation();
    setSelected(r.id);
    setDraggingId(r.id);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      roomX: r.x,
      roomY: r.y,
    });
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGGElement>) => {
    if (!draggingId || !dragStart) return;
    const dx = (e.clientX - dragStart.x) / (12 * zoom);
    const dy = (e.clientY - dragStart.y) / (12 * zoom);

    const newX = Math.max(0, Math.round(dragStart.roomX + dx));
    const newY = Math.max(0, Math.round(dragStart.roomY + dy));

    setRooms((prev) => prev.map((r) => (r.id === draggingId ? { ...r, x: newX, y: newY } : r)));
  };

  const handlePointerUp = (e: React.PointerEvent<SVGGElement>) => {
    if (draggingId) {
      setDraggingId(null);
      setDragStart(null);
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // pointer release safe fallback
      }
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Architectural Studio"
        title="Floor Plan Studio"
        description="Design professional CAD-quality 2D blueprints with furniture staging, Vastu zoning, and photorealistic 3D Isometric cutaway rendering."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            >
              <ZoomOut className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.2))}
            >
              <ZoomIn className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportSvg}>
              <Download className="size-4" /> Export CAD Blueprint
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 border border-primary/30 text-primary hover:bg-primary/10"
              onClick={handleRender3D}
            >
              <Sparkles className="size-4 text-primary" /> Render 3D Isometric View
            </Button>
            <Button size="sm" onClick={handleSave} disabled={savePlan.isPending}>
              {savePlan.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {planId ? "Update plan" : "Save plan"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        {/* Left Sidebar: Space Planning Controls & BHK Templates */}
        <aside className="surface-panel h-fit space-y-5 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="label-caps">AI Space Planner</p>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                5 Credits
              </Badge>
            </div>
            {!canAffordPlan && (
              <p className="text-xs text-destructive">
                Not enough credits ({creditProfile?.credits ?? 0} left).
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="plot">Plot dimensions</Label>
              <Input
                id="plot"
                value={plot}
                onChange={(e) => setPlot(e.target.value)}
                placeholder="30 x 40 ft"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bhk">Configuration</Label>
              <Select value={String(bhk)} onValueChange={(v) => setBhk(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 BHK Apartment</SelectItem>
                  <SelectItem value="2">2 BHK Residential</SelectItem>
                  <SelectItem value="3">3 BHK Premium Villa</SelectItem>
                  <SelectItem value="4">4 BHK Luxury Estate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brief">Vastu & Custom Brief</Label>
              <Textarea
                id="brief"
                rows={3}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="North-facing main door, pooja in NE corner, attached bathroom in master bedroom, open kitchen…"
              />
            </div>
            <Button
              className="w-full"
              onClick={runGenerate}
              disabled={generate.isPending || !canAffordPlan}
            >
              {generate.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Generate Vastu Plan
            </Button>
          </div>

          {/* Vastu Shastra Score Card */}
          <div className="rounded-lg border border-border bg-secondary/30 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1 text-foreground">
                <Compass className="size-3.5 text-primary" /> Vastu Compliance
              </span>
              <Badge
                variant={vastuScore >= 80 ? "default" : "secondary"}
                className={`text-[10px] ${vastuScore >= 80 ? "bg-emerald-600 text-white" : ""}`}
              >
                {vastuScore}% Compliant
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {vastuScore >= 80
                ? "Excellent Vastu alignment with Master Suite in SW and Kitchen in SE (Agneya)."
                : "Master bedroom or kitchen can be repositioned to South-West / South-East for higher Vastu energy."}
            </p>
          </div>

          <div>
            <p className="label-caps">Curated Templates</p>
            <div className="mt-3 flex flex-col gap-2">
              {templates.map((t) => (
                <Button
                  key={t.name}
                  variant="outline"
                  size="sm"
                  className="justify-between text-xs font-medium"
                  onClick={() => {
                    setRooms(t.rooms);
                    setSelected(t.rooms[0]?.id ?? null);
                    setBhk(t.bhk);
                    setPlot(t.plot);
                    setPlanId(null);
                    setPlanName(`${t.name} (${t.plot})`);
                  }}
                >
                  <span>{t.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{t.plot}</span>
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={addRoom} className="text-xs">
                <Plus className="size-4" /> Add Room to Canvas
              </Button>
            </div>
          </div>
        </aside>

        {/* Center: CAD Architectural Blueprint Canvas */}
        <section className="surface-panel overflow-auto p-4 flex flex-col">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label htmlFor="planName" className="text-xs text-muted-foreground">
                Drawing Title
              </Label>
              <Input
                id="planName"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="h-8 font-semibold text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                Canvas: {maxX}′ × {maxY}′
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono text-primary font-semibold">
                Built-up: {totalArea} sq ft
              </Badge>
            </div>
          </div>

          <div className="flex-1 min-h-[460px] grid place-items-center bg-secondary/15 rounded-lg border border-border p-4 relative overflow-hidden">
            {/* Vastu Compass Indicator Badge */}
            <div className="absolute top-6 right-6 z-10 bg-background/90 backdrop-blur border border-border rounded-md p-2 shadow-sm pointer-events-none flex flex-col items-center">
              <Compass className="size-5 text-primary animate-pulse" />
              <span className="text-[9px] font-bold tracking-widest text-primary mt-0.5">
                NORTH ↑
              </span>
            </div>

            <svg
              ref={svgRef}
              viewBox={`-2 -2 ${maxX + 4} ${maxY + 4}`}
              xmlns="http://www.w3.org/2000/svg"
              className="w-full max-w-3xl rounded-lg bg-[#0f172a] shadow-2xl select-none"
              style={{ minHeight: `${460 * zoom}px` }}
              role="img"
              aria-label="CAD Architectural Blueprint"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <defs>
                {/* Blueprint grid pattern */}
                <pattern id="cad-grid" width="2" height="2" patternUnits="userSpaceOnUse">
                  <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#1e293b" strokeWidth="0.08" />
                </pattern>
                <pattern id="cad-grid-major" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#334155" strokeWidth="0.15" />
                </pattern>
                {/* Hatch pattern for walls */}
                <pattern
                  id="wall-hatch"
                  width="1"
                  height="1"
                  patternTransform="rotate(45 0 0)"
                  patternUnits="userSpaceOnUse"
                >
                  <line x1="0" y1="0" x2="0" y2="1" stroke="#475569" strokeWidth="0.2" />
                </pattern>
              </defs>

              {/* Background Grid */}
              <rect x="-2" y="-2" width={maxX + 4} height={maxY + 4} fill="#0b1329" />
              <rect x="0" y="0" width={maxX} height={maxY} fill="url(#cad-grid)" />
              <rect x="0" y="0" width={maxX} height={maxY} fill="url(#cad-grid-major)" />

              {/* Outer Site Boundary Frame */}
              <rect
                x="0"
                y="0"
                width={maxX}
                height={maxY}
                fill="none"
                stroke="#64748b"
                strokeWidth="0.5"
                strokeDasharray="1.5, 0.8"
              />

              {/* Render Each Architectural Room */}
              {rooms.map((r) => {
                const active = r.id === selected;
                const rType = r.type || inferRoomType(r.name);
                const theme = ROOM_THEMES[rType] || ROOM_THEMES.bedroom;

                return (
                  <g
                    key={r.id}
                    className="cursor-move group"
                    onPointerDown={(e) => handlePointerDown(e, r)}
                  >
                    {/* Room Floor Fill */}
                    <rect
                      x={r.x}
                      y={r.y}
                      width={r.w}
                      height={r.h}
                      fill={theme.bg}
                      stroke={active ? "#38bdf8" : theme.border}
                      strokeWidth={active ? 0.6 : 0.35}
                      rx={0.3}
                    />

                    {/* Architectural Double Outer Wall Line */}
                    <rect
                      x={r.x + 0.3}
                      y={r.y + 0.3}
                      width={Math.max(0.1, r.w - 0.6)}
                      height={Math.max(0.1, r.h - 0.6)}
                      fill="none"
                      stroke={active ? "#38bdf8" : theme.border}
                      strokeWidth={0.15}
                      opacity={0.6}
                    />

                    {/* Procedural CAD Furniture Staging */}
                    {rType === "master_bedroom" || rType === "bedroom" ? (
                      /* CAD Bed Symbol with Pillows & Nightstands */
                      <g opacity={0.65} transform={`translate(${r.x + r.w / 2 - 2.5}, ${r.y + 1})`}>
                        {/* Bed Frame */}
                        <rect
                          x="0"
                          y="0"
                          width="5"
                          height="5.5"
                          rx="0.3"
                          fill="#1e293b"
                          stroke="#94a3b8"
                          strokeWidth="0.15"
                        />
                        {/* Pillows */}
                        <rect
                          x="0.5"
                          y="0.4"
                          width="1.7"
                          height="1.1"
                          rx="0.2"
                          fill="#334155"
                          stroke="#cbd5e1"
                          strokeWidth="0.1"
                        />
                        <rect
                          x="2.8"
                          y="0.4"
                          width="1.7"
                          height="1.1"
                          rx="0.2"
                          fill="#334155"
                          stroke="#cbd5e1"
                          strokeWidth="0.1"
                        />
                        {/* Duvet Line */}
                        <line x1="0" y1="2.2" x2="5" y2="2.2" stroke="#64748b" strokeWidth="0.15" />
                      </g>
                    ) : rType === "living" ? (
                      /* CAD Living Room L-Sofa & Coffee Table */
                      <g opacity={0.65} transform={`translate(${r.x + 1}, ${r.y + 1})`}>
                        <rect
                          x="0"
                          y="0"
                          width="6"
                          height="2"
                          rx="0.3"
                          fill="#1e293b"
                          stroke="#94a3b8"
                          strokeWidth="0.15"
                        />
                        <rect
                          x="0"
                          y="2"
                          width="2.2"
                          height="3"
                          rx="0.3"
                          fill="#1e293b"
                          stroke="#94a3b8"
                          strokeWidth="0.15"
                        />
                        {/* Coffee Table */}
                        <rect
                          x="3"
                          y="2.5"
                          width="2.8"
                          height="1.8"
                          rx="0.2"
                          fill="#334155"
                          stroke="#94a3b8"
                          strokeWidth="0.1"
                        />
                      </g>
                    ) : rType === "kitchen" ? (
                      /* CAD Kitchen Counter with Stove & Sink */
                      <g opacity={0.65} transform={`translate(${r.x + 0.6}, ${r.y + 0.6})`}>
                        <rect
                          x="0"
                          y="0"
                          width={Math.max(2, r.w - 1.2)}
                          height="2.2"
                          rx="0.2"
                          fill="#1e293b"
                          stroke="#d97706"
                          strokeWidth="0.15"
                        />
                        {/* Burner circles */}
                        <circle
                          cx="2"
                          cy="1.1"
                          r="0.45"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="0.1"
                        />
                        <circle
                          cx="3.2"
                          cy="1.1"
                          r="0.45"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="0.1"
                        />
                        {/* Sink */}
                        <rect
                          x={Math.max(4, r.w - 3.8)}
                          y="0.4"
                          width="2"
                          height="1.4"
                          rx="0.2"
                          fill="#334155"
                          stroke="#94a3b8"
                          strokeWidth="0.1"
                        />
                      </g>
                    ) : rType === "bathroom" ? (
                      /* CAD WC & Sink Symbol */
                      <g opacity={0.65} transform={`translate(${r.x + 0.8}, ${r.y + 0.8})`}>
                        {/* Commode tank & bowl */}
                        <rect
                          x="0"
                          y="0"
                          width="1.8"
                          height="0.8"
                          rx="0.1"
                          fill="#334155"
                          stroke="#94a3b8"
                          strokeWidth="0.1"
                        />
                        <ellipse
                          cx="0.9"
                          cy="1.5"
                          rx="0.7"
                          ry="0.9"
                          fill="#1e293b"
                          stroke="#94a3b8"
                          strokeWidth="0.1"
                        />
                      </g>
                    ) : rType === "pooja" ? (
                      /* CAD Pooja Mandir Icon */
                      <g opacity={0.7} transform={`translate(${r.x + r.w / 2 - 1}, ${r.y + 0.8})`}>
                        <rect
                          x="0"
                          y="0"
                          width="2"
                          height="1.6"
                          rx="0.2"
                          fill="#854d0e"
                          stroke="#facc15"
                          strokeWidth="0.12"
                        />
                        <circle cx="1" cy="0.8" r="0.35" fill="#facc15" />
                      </g>
                    ) : null}

                    {/* Architectural Door Swing Arc Symbol */}
                    <g opacity={0.75} transform={`translate(${r.x + 0.4}, ${r.y + r.h - 0.4})`}>
                      <path
                        d="M 0 0 A 2.2 2.2 0 0 1 2.2 -2.2"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="0.12"
                        strokeDasharray="0.3, 0.2"
                      />
                      <line x1="0" y1="0" x2="2.2" y2="0" stroke="#cbd5e1" strokeWidth="0.18" />
                    </g>

                    {/* Window Symbol on perimeter */}
                    <g opacity={0.75} transform={`translate(${r.x + r.w / 2 - 1.5}, ${r.y + 0.1})`}>
                      <line x1="0" y1="0" x2="3" y2="0" stroke="#38bdf8" strokeWidth="0.25" />
                      <line x1="0" y1="0.2" x2="3" y2="0.2" stroke="#38bdf8" strokeWidth="0.15" />
                    </g>

                    {/* Room Label */}
                    <text
                      x={r.x + r.w / 2}
                      y={r.y + r.h / 2 + 1}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize={1.25}
                      fontWeight="600"
                      className="pointer-events-none drop-shadow"
                    >
                      {r.name}
                    </text>

                    {/* Room Dimensions & Area */}
                    <text
                      x={r.x + r.w / 2}
                      y={r.y + r.h / 2 + 2.5}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize={0.9}
                      fontFamily="monospace"
                      className="pointer-events-none"
                    >
                      {r.w}′ × {r.h}′ ({r.w * r.h} sqft)
                    </text>

                    {/* Active Selection Glow Ring */}
                    {active && (
                      <rect
                        x={r.x - 0.2}
                        y={r.y - 0.2}
                        width={r.w + 0.4}
                        height={r.h + 0.4}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={0.25}
                        strokeDasharray="0.8, 0.4"
                      />
                    )}
                  </g>
                );
              })}

              {/* Dimension Tick Marks on Canvas Edges */}
              <text
                x={maxX / 2}
                y="-0.6"
                textAnchor="middle"
                fill="#64748b"
                fontSize={0.9}
                fontFamily="monospace"
              >
                ← {maxX}′-0″ PLOT WIDTH →
              </text>
              <text
                x="-0.6"
                y={maxY / 2}
                textAnchor="middle"
                fill="#64748b"
                fontSize={0.9}
                fontFamily="monospace"
                transform={`rotate(-90 -0.6 ${maxY / 2})`}
              >
                ← {maxY}′-0″ PLOT DEPTH →
              </text>
            </svg>
          </div>

          {/* Architectural Drawing Title Block Footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <CheckCircle2 className="size-3.5 text-emerald-500" /> CAD Architectural Blueprint
              </span>
              <span>Scale 1:100</span>
              <span>Grid: 1 ft Snap</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {CONCEPTUAL_NOTE}
              </Badge>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Selected Room Inspector & Saved Plans */}
        <aside className="space-y-5">
          <div className="surface-panel h-fit space-y-4 p-4">
            <div className="flex items-center justify-between">
              <p className="label-caps">Room Inspector</p>
              {selectedRoom && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {selectedRoom.w * selectedRoom.h} sq ft
                </Badge>
              )}
            </div>

            {selectedRoom ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="rname" className="text-xs">
                    Room Name
                  </Label>
                  <Input
                    id="rname"
                    value={selectedRoom.name}
                    onChange={(e) => update({ name: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Layers className="size-3" /> Zone Type
                  </Label>
                  <Select
                    value={selectedRoom.type || inferRoomType(selectedRoom.name)}
                    onValueChange={(v) => update({ type: v as RoomType })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="living">Living & Lounge</SelectItem>
                      <SelectItem value="master_bedroom">Master Suite</SelectItem>
                      <SelectItem value="bedroom">Bedroom</SelectItem>
                      <SelectItem value="kitchen">Modular Kitchen</SelectItem>
                      <SelectItem value="dining">Dining Hall</SelectItem>
                      <SelectItem value="bathroom">Bathroom / WC</SelectItem>
                      <SelectItem value="balcony">Balcony / Sitout</SelectItem>
                      <SelectItem value="pooja">Pooja Room</SelectItem>
                      <SelectItem value="foyer">Entrance Foyer</SelectItem>
                      <SelectItem value="utility">Utility & Wash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="rw" className="text-xs">
                      Width (ft)
                    </Label>
                    <div className="flex items-center gap-1">
                      <Input
                        id="rw"
                        type="number"
                        min={3}
                        max={40}
                        value={selectedRoom.w}
                        onChange={(e) => update({ w: Math.max(3, Number(e.target.value) || 3) })}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rh" className="text-xs">
                      Length (ft)
                    </Label>
                    <div className="flex items-center gap-1">
                      <Input
                        id="rh"
                        type="number"
                        min={3}
                        max={40}
                        value={selectedRoom.h}
                        onChange={(e) => update({ h: Math.max(3, Number(e.target.value) || 3) })}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="rx" className="text-xs">
                      Grid X (ft)
                    </Label>
                    <Input
                      id="rx"
                      type="number"
                      value={selectedRoom.x}
                      onChange={(e) => update({ x: Math.max(0, Number(e.target.value) || 0) })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="ry" className="text-xs">
                      Grid Y (ft)
                    </Label>
                    <Input
                      id="ry"
                      type="number"
                      value={selectedRoom.y}
                      onChange={(e) => update({ y: Math.max(0, Number(e.target.value) || 0) })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Move className="size-3" /> Drag on canvas
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={removeRoom}
                  >
                    <Trash2 className="size-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                Click any room on the canvas to inspect, resize, and edit its attributes.
              </div>
            )}
          </div>

          <div className="surface-panel h-fit space-y-3 p-4">
            <p className="label-caps">Saved Floor Plans</p>
            {plansLoading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : savedPlans.length === 0 ? (
              <p className="text-xs text-muted-foreground">No saved floor plans yet.</p>
            ) : (
              <ul className="space-y-1.5 max-h-56 overflow-auto">
                {savedPlans.map((p) => (
                  <li key={p.id} className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className={`flex-1 truncate rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-secondary/60 ${
                        p.id === planId
                          ? "bg-secondary text-primary font-medium"
                          : "text-muted-foreground"
                      }`}
                      onClick={() => {
                        if (p.rooms.length === 0) {
                          toast.error("That plan has no room data.");
                          return;
                        }
                        const typedRooms = p.rooms.map((r) => ({
                          ...r,
                          type: r.type || inferRoomType(r.name),
                        }));
                        setRooms(typedRooms);
                        setSelected(typedRooms[0]?.id ?? null);
                        setPlanId(p.id);
                        setPlanName(p.prompt || "Untitled plan");
                      }}
                    >
                      {p.prompt || "Untitled plan"}
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        deletePlan.mutate(p.id);
                        if (p.id === planId) setPlanId(null);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* 3D Isometric Cutaway AI Visualizer Modal */}
      <Dialog open={render3DOpen} onOpenChange={setRender3DOpen}>
        <DialogContent className="max-w-4xl bg-background/95 backdrop-blur p-4 sm:p-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Box className="size-5 text-primary" /> 3D Isometric Architectural Cutaway
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Photorealistic 3D architectural render generated directly from your 2D space plan
            dimensions.
          </DialogDescription>

          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Render Style:</Label>
                <Select value={style3D} onValueChange={setStyle3D}>
                  <SelectTrigger className="h-8 text-xs w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="photorealistic">Photorealistic Luxury</SelectItem>
                    <SelectItem value="japandi">Japandi Warm Minimal</SelectItem>
                    <SelectItem value="biophilic">Biophilic Natural</SelectItem>
                    <SelectItem value="brutalist">Contemporary Concrete</SelectItem>
                    <SelectItem value="minimal_clean">Minimal Scandinavian</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                onClick={handleRender3D}
                disabled={render3D.isPending || !canAfford3D}
                className="h-8 text-xs"
              >
                {render3D.isPending ? (
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                ) : (
                  <Sparkles className="size-3.5 mr-1.5" />
                )}
                Regenerate 3D Cutaway
              </Button>
            </div>

            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-border bg-secondary/30 grid place-items-center">
              {render3DResult ? (
                <img
                  src={render3DResult}
                  alt="3D Floor Plan Cutaway"
                  className="size-full object-cover"
                />
              ) : render3D.isPending ? (
                <div className="text-center space-y-3 p-6">
                  <Loader2 className="mx-auto size-8 animate-spin text-primary" />
                  <p className="text-sm font-medium">Generating 3D Isometric Cutaway…</p>
                  <p className="text-xs text-muted-foreground">
                    Translating 2D room boundaries into 3D furnished architectural geometry
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2 p-6">
                  <Box className="mx-auto size-8 text-muted-foreground/60" />
                  <p className="text-xs text-muted-foreground">
                    Click "Render 3D Isometric View" to synthesize the 3D model.
                  </p>
                </div>
              )}
            </div>

            {render3DResult && (
              <div className="flex items-center justify-between pt-2">
                <Badge variant="outline" className="text-[10px]">
                  16:9 8K UHD Architectural 3D Cutaway
                </Badge>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={render3DResult}
                      download="3d-isometric-floorplan.png"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download className="size-4 mr-1.5" /> Download 3D Render
                    </a>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => window.open(render3DResult, "_blank")}
                  >
                    <Maximize2 className="size-4 mr-1.5" /> Fullscreen View
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
