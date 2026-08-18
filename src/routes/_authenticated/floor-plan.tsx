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
  FileText,
  RefreshCw,
  Sliders,
  Sparkle,
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
import { PresentationSheet } from "@/components/archigen/presentation-sheet";
import { CONCEPTUAL_NOTE } from "@/lib/archigen-data";
import {
  useGenerateFloorPlan,
  useRender3DFloorPlan,
} from "@/hooks/use-generate";
import { useProfile } from "@/hooks/use-profile";
import { useDeleteFloorPlan, useFloorPlans, useSaveFloorPlan } from "@/hooks/use-floor-plans";
import type { PlanRoom } from "@/lib/archigen.functions";

export const MATERIAL_PALETTES = [
  {
    id: "travertine_oak",
    label: "Travertine & Light Oak",
    desc: "Honed Italian travertine stone, natural white oak wood, ambient cove lighting",
  },
  {
    id: "microcement_walnut",
    label: "Microcement & Walnut",
    desc: "Seamless grey microcement, rich American walnut millwork, brushed bronze joinery",
  },
  {
    id: "shou_sugi_ban",
    label: "Shou Sugi Ban & Slate",
    desc: "Charred timber accents, black slate stone tiles, minimalist matte black hardware",
  },
  {
    id: "terracotta_brick",
    label: "Exposed Terracotta & Brass",
    desc: "Handmade terracotta tiles, exposed brick feature walls, brushed brass fixtures",
  },
  {
    id: "scandinavian_birch",
    label: "Nordic Birch & White Marble",
    desc: "Pale birch wood flooring, Carrara marble island counters, crisp natural daylight",
  },
  {
    id: "corten_concrete",
    label: "Board-Formed Concrete & Corten",
    desc: "Architectural concrete walls, Corten steel framing, industrial loft glass",
  },
] as const;

export const PLOT_PRESETS = [
  { label: "30' × 50' (1500 sq ft Plot)", w: 30, d: 50, builtUp: 1500 },
  { label: "30' × 40' (1200 sq ft Plot)", w: 30, d: 40, builtUp: 1200 },
  { label: "40' × 50' (2000 sq ft Plot)", w: 40, d: 50, builtUp: 2000 },
  { label: "40' × 60' (2400 sq ft Plot)", w: 40, d: 60, builtUp: 2400 },
  { label: "20' × 40' (800 sq ft Plot)", w: 20, d: 40, builtUp: 800 },
  { label: "50' × 80' (4000 sq ft Plot)", w: 50, d: 80, builtUp: 3500 },
] as const;

export const INSTRUCTION_TAGS = [
  "Attached toilets for all bedrooms",
  "Covered car parking bay with sedan",
  "Puja room in North-East (Ishanya)",
  "Open modular kitchen with utility",
  "Sit-out verandah with planters",
  "Staircase to first floor terrace",
  "Master suite in South-West",
] as const;

export const Route = createFileRoute("/_authenticated/floor-plan")({
  head: () => ({
    meta: [
      { title: "Floor Plan Studio — ArchiGen AI" },
      {
        name: "description",
        content:
          "2D architectural presentation floor plans, Vastu analysis, and 3D isometric cutaway visualization.",
      },
      { property: "og:title", content: "Floor Plan Studio — ArchiGen AI" },
      {
        property: "og:description",
        content: "Interactive 2D colored presentation floor plans with Vastu intelligence and 3D Isometric cutaway rendering.",
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
  | "utility"
  | "parking"
  | "staircase"
  | "sitout";

const ROOM_THEMES: Record<
  RoomType,
  {
    bgColor: string;
    borderColor: string;
    textColor: string;
    label: string;
  }
> = {
  living: {
    bgColor: "#faf6f0",
    borderColor: "#1e293b",
    textColor: "#0f172a",
    label: "Living Room",
  },
  master_bedroom: {
    bgColor: "#f5ece3",
    borderColor: "#1e293b",
    textColor: "#0f172a",
    label: "Master Bedroom",
  },
  bedroom: {
    bgColor: "#f7eee6",
    borderColor: "#1e293b",
    textColor: "#0f172a",
    label: "Bedroom",
  },
  kitchen: {
    bgColor: "#f1f5f9",
    borderColor: "#1e293b",
    textColor: "#0f172a",
    label: "Kitchen",
  },
  dining: {
    bgColor: "#fdf8f4",
    borderColor: "#1e293b",
    textColor: "#0f172a",
    label: "Dining Hall",
  },
  bathroom: {
    bgColor: "#e2e8f0",
    borderColor: "#1e293b",
    textColor: "#0f172a",
    label: "Toilet / Bath",
  },
  balcony: {
    bgColor: "#f1f5f9",
    borderColor: "#1e293b",
    textColor: "#0f172a",
    label: "Balcony",
  },
  pooja: {
    bgColor: "#fef9c3",
    borderColor: "#1e293b",
    textColor: "#0f172a",
    label: "Puja Room",
  },
  foyer: {
    bgColor: "#faf6f0",
    borderColor: "#1e293b",
    textColor: "#0f172a",
    label: "Foyer",
  },
  utility: {
    bgColor: "#f1f5f9",
    borderColor: "#1e293b",
    textColor: "#0f172a",
    label: "Utility",
  },
  parking: {
    bgColor: "#e2e8f0",
    borderColor: "#1e293b",
    textColor: "#0f172a",
    label: "Parking",
  },
  staircase: {
    bgColor: "#e2e8f0",
    borderColor: "#1e293b",
    textColor: "#0f172a",
    label: "Staircase",
  },
  sitout: {
    bgColor: "#cbd5e1",
    borderColor: "#1e293b",
    textColor: "#0f172a",
    label: "Sit Out",
  },
};

function inferRoomType(name: string): RoomType {
  const n = name.toLowerCase();
  if (n.includes("parking") || n.includes("garage") || n.includes("car")) return "parking";
  if (n.includes("stair") || n.includes("step")) return "staircase";
  if (n.includes("sitout") || n.includes("sit out") || n.includes("porch") || n.includes("verandah"))
    return "sitout";
  if (n.includes("master")) return "master_bedroom";
  if (n.includes("living") || n.includes("hall") || n.includes("lounge")) return "living";
  if (n.includes("kitchen")) return "kitchen";
  if (n.includes("dining")) return "dining";
  if (n.includes("bath") || n.includes("toilet") || n.includes("wc")) return "bathroom";
  if (n.includes("balcony") || n.includes("deck") || n.includes("terrace")) return "balcony";
  if (n.includes("pooja") || n.includes("puja") || n.includes("mandir") || n.includes("prayer"))
    return "pooja";
  if (n.includes("foyer") || n.includes("entry") || n.includes("lobby")) return "foyer";
  if (n.includes("utility") || n.includes("wash") || n.includes("store")) return "utility";
  return "bedroom";
}

// Brand New Curated Real-World Architectural Templates
const templates: { name: string; bhk: number; plotWidth: number; plotDepth: number; builtUp: number; rooms: Room[] }[] = [
  {
    name: "1500 SQ. FT. Luxury 3 BHK Villa",
    bhk: 3,
    plotWidth: 30,
    plotDepth: 50,
    builtUp: 1500,
    rooms: [
      { id: "r1", name: "Utility", type: "utility", x: 0, y: 0, w: 9, h: 5 },
      { id: "r2", name: "Kitchen", type: "kitchen", x: 0, y: 5, w: 9, h: 11 },
      { id: "r3", name: "Dining", type: "dining", x: 9, y: 0, w: 11, h: 12 },
      { id: "r4", name: "Bedroom 2", type: "bedroom", x: 20, y: 0, w: 10, h: 12 },
      { id: "r5", name: "Att. Toilet", type: "bathroom", x: 22, y: 12, w: 8, h: 5 },
      { id: "r6", name: "Att. Toilet", type: "bathroom", x: 22, y: 17, w: 8, h: 5 },
      { id: "r7", name: "Puja", type: "pooja", x: 0, y: 16, w: 5, h: 4 },
      { id: "r8", name: "Staircase", type: "staircase", x: 0, y: 20, w: 5, h: 12 },
      { id: "r9", name: "Living Room", type: "living", x: 5, y: 12, w: 15, h: 18 },
      { id: "r10", name: "Bedroom 1", type: "master_bedroom", x: 20, y: 22, w: 10, h: 14 },
      { id: "r11", name: "C. Toilet", type: "bathroom", x: 0, y: 32, w: 6, h: 6 },
      { id: "r12", name: "Bedroom 3", type: "bedroom", x: 0, y: 38, w: 11, h: 12 },
      { id: "r13", name: "Foyer", type: "foyer", x: 11, y: 30, w: 9, h: 6 },
      { id: "r14", name: "Sit Out", type: "sitout", x: 11, y: 36, w: 9, h: 8 },
      { id: "r15", name: "Parking", type: "parking", x: 20, y: 36, w: 10, h: 14 },
    ],
  },
  {
    name: "1200 SQ. FT. Modern 2 BHK Home",
    bhk: 2,
    plotWidth: 30,
    plotDepth: 40,
    builtUp: 1200,
    rooms: [
      { id: "r1", name: "Kitchen", type: "kitchen", x: 0, y: 0, w: 10, h: 12 },
      { id: "r2", name: "Utility", type: "utility", x: 10, y: 0, w: 6, h: 6 },
      { id: "r3", name: "Dining Hall", type: "dining", x: 16, y: 0, w: 14, h: 12 },
      { id: "r4", name: "Master Suite", type: "master_bedroom", x: 0, y: 12, w: 14, h: 14 },
      { id: "r5", name: "Master Bath", type: "bathroom", x: 14, y: 12, w: 6, h: 7 },
      { id: "r6", name: "Common Bath", type: "bathroom", x: 14, y: 19, w: 6, h: 7 },
      { id: "r7", name: "Bedroom 2", type: "bedroom", x: 20, y: 12, w: 10, h: 14 },
      { id: "r8", name: "Living Lounge", type: "living", x: 0, y: 26, w: 14, h: 14 },
      { id: "r9", name: "Entrance Foyer", type: "foyer", x: 14, y: 26, w: 6, h: 6 },
      { id: "r10", name: "Sit Out", type: "sitout", x: 20, y: 26, w: 10, h: 6 },
      { id: "r11", name: "Car Parking", type: "parking", x: 14, y: 32, w: 16, h: 8 },
    ],
  },
  {
    name: "2000 SQ. FT. Grand 4 BHK Villa",
    bhk: 4,
    plotWidth: 40,
    plotDepth: 50,
    builtUp: 2000,
    rooms: [
      { id: "r1", name: "Utility & Store", type: "utility", x: 0, y: 0, w: 10, h: 6 },
      { id: "r2", name: "Chef Kitchen", type: "kitchen", x: 0, y: 6, w: 12, h: 12 },
      { id: "r3", name: "Dining Hall", type: "dining", x: 12, y: 0, w: 16, h: 14 },
      { id: "r4", name: "Guest Suite", type: "bedroom", x: 28, y: 0, w: 12, h: 14 },
      { id: "r5", name: "Guest Bath", type: "bathroom", x: 28, y: 14, w: 8, h: 5 },
      { id: "r6", name: "Puja Room", type: "pooja", x: 0, y: 18, w: 6, h: 6 },
      { id: "r7", name: "Living Hall", type: "living", x: 10, y: 14, w: 18, h: 18 },
      { id: "r8", name: "Master Suite", type: "master_bedroom", x: 0, y: 24, w: 14, h: 16 },
      { id: "r9", name: "Master Bath", type: "bathroom", x: 0, y: 40, w: 8, h: 6 },
      { id: "r10", name: "Staircase Core", type: "staircase", x: 8, y: 40, w: 6, h: 10 },
      { id: "r11", name: "Bedroom 3", type: "bedroom", x: 28, y: 19, w: 12, h: 14 },
      { id: "r12", name: "Bedroom 4 / Study", type: "bedroom", x: 28, y: 33, w: 12, h: 11 },
      { id: "r13", name: "Common Bath", type: "bathroom", x: 22, y: 32, w: 6, h: 6 },
      { id: "r14", name: "Entrance Foyer", type: "foyer", x: 10, y: 32, w: 12, h: 6 },
      { id: "r15", name: "Sit-Out Verandah", type: "sitout", x: 10, y: 38, w: 12, h: 12 },
      { id: "r16", name: "Double Parking", type: "parking", x: 22, y: 38, w: 18, h: 12 },
    ],
  },
  {
    name: "800 SQ. FT. Smart 1 BHK Studio",
    bhk: 1,
    plotWidth: 20,
    plotDepth: 40,
    builtUp: 800,
    rooms: [
      { id: "r1", name: "Modular Kitchen", type: "kitchen", x: 0, y: 0, w: 8, h: 10 },
      { id: "r2", name: "Dining Space", type: "dining", x: 8, y: 0, w: 12, h: 10 },
      { id: "r3", name: "Master Bedroom", type: "master_bedroom", x: 0, y: 10, w: 12, h: 14 },
      { id: "r4", name: "Attached Bath", type: "bathroom", x: 12, y: 10, w: 8, h: 6 },
      { id: "r5", name: "Common Toilet", type: "bathroom", x: 12, y: 16, w: 8, h: 5 },
      { id: "r6", name: "Living Lounge", type: "living", x: 0, y: 24, w: 12, h: 15 },
      { id: "r7", name: "Foyer", type: "foyer", x: 12, y: 21, w: 8, h: 6 },
      { id: "r8", name: "Sit Out", type: "sitout", x: 0, y: 33, w: 8, h: 7 },
      { id: "r9", name: "Car / Bike Parking", type: "parking", x: 8, y: 27, w: 12, h: 13 },
    ],
  },
  {
    name: "2400 SQ. FT. Contemporary 4 BHK Estate",
    bhk: 4,
    plotWidth: 40,
    plotDepth: 60,
    builtUp: 2400,
    rooms: [
      { id: "r1", name: "Pantry & Utility", type: "utility", x: 0, y: 0, w: 10, h: 8 },
      { id: "r2", name: "Island Kitchen", type: "kitchen", x: 0, y: 8, w: 14, h: 12 },
      { id: "r3", name: "Dining Hall", type: "dining", x: 14, y: 0, w: 16, h: 16 },
      { id: "r4", name: "Puja Mandir", type: "pooja", x: 30, y: 0, w: 6, h: 6 },
      { id: "r5", name: "Guest Suite", type: "bedroom", x: 26, y: 6, w: 14, h: 14 },
      { id: "r6", name: "Guest Bath", type: "bathroom", x: 32, y: 20, w: 8, h: 6 },
      { id: "r7", name: "Master Suite", type: "master_bedroom", x: 0, y: 20, w: 16, h: 16 },
      { id: "r8", name: "Master Bath", type: "bathroom", x: 0, y: 36, w: 10, h: 8 },
      { id: "r9", name: "Living Hall", type: "living", x: 12, y: 20, w: 20, h: 20 },
      { id: "r10", name: "Bedroom 3", type: "bedroom", x: 26, y: 26, w: 14, h: 14 },
      { id: "r11", name: "Home Office / Bed 4", type: "bedroom", x: 26, y: 40, w: 14, h: 12 },
      { id: "r12", name: "Powder Room", type: "bathroom", x: 20, y: 40, w: 6, h: 6 },
      { id: "r13", name: "Staircase", type: "staircase", x: 0, y: 44, w: 8, h: 12 },
      { id: "r14", name: "Grand Foyer", type: "foyer", x: 10, y: 40, w: 12, h: 8 },
      { id: "r15", name: "Landscaped Sit-Out", type: "sitout", x: 10, y: 48, w: 14, h: 12 },
      { id: "r16", name: "Double Carport", type: "parking", x: 24, y: 48, w: 16, h: 12 },
    ],
  },
];

function formatHousePlanTitle(w: number, d: number, sqft: number, bhkCount: number) {
  const area = sqft || w * d;
  return `${area} SQ. FT. ${bhkCount} BHK HOUSE PLAN (${w}'0" × ${d}'0")`;
}

const defaultRooms: Room[] = templates[0]!.rooms;

function FloorPlanPage() {
  const [rooms, setRooms] = useState<Room[]>(defaultRooms);
  const [selected, setSelected] = useState<string | null>("r9");
  const [zoom, setZoom] = useState(1);
  const [planId, setPlanId] = useState<string | null>(null);

  // Plot and Built-up Size Parameters
  const [plotWidth, setPlotWidth] = useState(30);
  const [plotDepth, setPlotDepth] = useState(50);
  const [builtUpArea, setBuiltUpArea] = useState(1500);
  const [facing, setFacing] = useState("North");
  const [bhk, setBhk] = useState(3);
  const [planName, setPlanName] = useState(() => formatHousePlanTitle(30, 50, 1500, 3));
  const [brief, setBrief] = useState(
    "North-facing main entrance, master bedroom in South-West, kitchen in South-East (Agneya), puja room in North-East, car parking bay in front right, attached toilets, sit-out with planters.",
  );

  const [style3D, setStyle3D] = useState("photorealistic");
  const [materialPalette, setMaterialPalette] = useState("travertine_oak");

  // 3D Isometric Visualizer State
  const [render3DOpen, setRender3DOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetData, setSheetData] = useState<{
    url: string;
    title: string;
    tool: string;
    prompt: string;
  } | null>(null);

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
  const canAffordRender = (creditProfile?.credits ?? 0) >= 4;

  const savePlan = useSaveFloorPlan();
  const deletePlan = useDeleteFloorPlan();
  const { data: savedPlans = [], isLoading: plansLoading } = useFloorPlans();

  const selectedRoom = rooms.find((r) => r.id === selected) ?? null;
  const totalArea = rooms.reduce((sum, r) => sum + r.w * r.h, 0);

  // Dynamic plot dimension string
  const plotStr = `${plotWidth} x ${plotDepth} ft`;

  // Bounding box calculation for plot auto-scaling
  const maxX = useMemo(() => Math.max(plotWidth, ...rooms.map((r) => r.x + r.w)), [rooms, plotWidth]);
  const maxY = useMemo(() => Math.max(plotDepth, ...rooms.map((r) => r.y + r.h)), [rooms, plotDepth]);

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
        if (isSouth && isWest) score += 100; // SW Ideal
        else if (isSouth) score += 70;
        else score += 40;
      }
      if (type === "kitchen") {
        items++;
        if (isSouth && isEast) score += 100; // SE Agni Ideal
        else if (isNorth && isWest) score += 80; // NW Alternative
        else score += 50;
      }
      if (type === "pooja") {
        items++;
        if (isNorth && isEast) score += 100; // NE Ishanya Ideal
        else if (isNorth) score += 80;
        else score += 45;
      }
      if (type === "living") {
        items++;
        if (isNorth || isEast) score += 95;
        else score += 70;
      }
    }
    return items > 0 ? Math.round(score / items) : 92;
  }, [rooms, maxX, maxY]);

  const update = (patch: Partial<Room>) => {
    setRooms((prev) => {
      const next = prev.map((r) => (r.id === selected ? { ...r, ...patch } : r));
      const newArea = next.reduce((sum, r) => sum + r.w * r.h, 0);
      setBuiltUpArea(newArea);
      setPlanName(formatHousePlanTitle(plotWidth, plotDepth, newArea, bhk));
      return next;
    });
  };

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
    setRooms((prev) => {
      const next = [...prev, newRoom];
      const newArea = next.reduce((sum, r) => sum + r.w * r.h, 0);
      setBuiltUpArea(newArea);
      setPlanName(formatHousePlanTitle(plotWidth, plotDepth, newArea, bhk));
      return next;
    });
    setSelected(id);
  };

  const removeRoom = () => {
    if (!selected) return;
    setRooms((prev) => {
      const next = prev.filter((r) => r.id !== selected);
      const newArea = next.reduce((sum, r) => sum + r.w * r.h, 0);
      setBuiltUpArea(newArea);
      setPlanName(formatHousePlanTitle(plotWidth, plotDepth, newArea, bhk));
      return next;
    });
    setSelected(null);
  };

  // Automatically generates floor plan strictly adhering to plot size, built-up size, BHK & instructions
  const runGenerate = () => {
    generate.mutate(
      {
        brief,
        bhk,
        plot: plotStr,
        builtUpArea: `${builtUpArea} sq ft`,
        facing,
      },
      {
        onSuccess: (res) => {
          const typedRooms = res.rooms.map((r) => ({
            ...r,
            type: r.type || inferRoomType(r.name),
          }));
          const newTotalArea = typedRooms.reduce((sum, r) => sum + r.w * r.h, 0);
          setRooms(typedRooms);
          setSelected(typedRooms[0]?.id ?? null);
          setPlanId(null);
          setBuiltUpArea(newTotalArea);
          setPlanName(formatHousePlanTitle(plotWidth, plotDepth, newTotalArea, bhk));
          setRender3DResult(null);
          queryClient.invalidateQueries({ queryKey: ["floor-plans"] });
          toast.success("Floor plan automatically generated as per instructions!", {
            description: `Generated ${bhk} BHK layout for ${plotStr} plot with ${newTotalArea} sq ft built-up area.`,
          });
        },
      },
    );
  };

  const handleSave = () =>
    savePlan.mutate(
      {
        id: planId,
        name: planName.trim() || "Untitled plan",
        rooms,
        settings: {
          bhk,
          plot: plotStr,
          render3d_url: render3DResult,
          style3D,
          materialPalette,
        },
      },
      {
        onSuccess: (id) => {
          setPlanId(id);
          toast.success("Floor plan saved");
        },
      },
    );

  const handleRender3D = async () => {
    if (!canAffordRender) {
      toast.error("Not enough credits", {
        description: "3D Isometric cutaway render requires 4 credits.",
      });
      return;
    }
    setRender3DOpen(true);
    setRender3DResult(null);

    const selectedPalette = MATERIAL_PALETTES.find((p) => p.id === materialPalette);
    const combinedStyle = selectedPalette
      ? `${style3D}, featuring ${selectedPalette.label} (${selectedPalette.desc})`
      : style3D;

    const res = await render3D.mutateAsync({
      rooms,
      bhk,
      plot: plotStr,
      stylePreset: combinedStyle,
    });
    if (res?.url) {
      setRender3DResult(res.url);
      toast.success("3D Isometric cutaway rendered!");
      if (planId) {
        savePlan.mutate({
          id: planId,
          name: planName.trim() || "Untitled plan",
          rooms,
          settings: {
            bhk,
            plot: plotStr,
            render3d_url: res.url,
            style3D,
            materialPalette,
          },
        });
      }
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
    toast.success("Floor Plan exported as SVG");
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
        description="Configure plot size, target built-up area, BHK, and custom instructions to automatically generate professional Vastu-compliant 2D presentation floor plans with 3D isometric cutaways."
        actions={
          <div className="flex flex-wrap items-center gap-2">
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
            <Button variant="outline" size="sm" onClick={exportSvg} className="gap-1.5 font-medium">
              <Download className="size-4 mr-1 text-emerald-500" /> Export Floor Plan SVG
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 border border-primary/30 text-primary hover:bg-primary/10"
              onClick={handleRender3D}
            >
              <Sparkles className="size-4 text-primary" /> Render 3D Isometric View
            </Button>
            <Button size="sm" onClick={handleSave} disabled={savePlan.isPending} className="gap-1.5">
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

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)_300px]">
        {/* Left Sidebar: Space Planning Controls (Plot Size, Built-up Size, Facing & Auto-Generator) */}
        <aside className="surface-panel h-fit space-y-5 p-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <p className="label-caps flex items-center gap-1.5">
                <Sliders className="size-3.5 text-primary" /> Space Planner
              </p>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                5 Credits
              </Badge>
            </div>
            {!canAffordPlan && (
              <p className="text-xs text-destructive">
                Not enough credits ({creditProfile?.credits ?? 0} left).
              </p>
            )}

            {/* 1. Plot Size (Preset & Dimensions) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Plot Size</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {plotWidth * plotDepth} sq ft
                </span>
              </Label>

              <Select
                value={`${plotWidth}x${plotDepth}`}
                onValueChange={(val) => {
                  const [w, d] = val.split("x").map(Number);
                  if (w && d) {
                    setPlotWidth(w);
                    setPlotDepth(d);
                    const newBuiltUp = w * d;
                    setBuiltUpArea(newBuiltUp);
                    setPlanName(formatHousePlanTitle(w, d, newBuiltUp, bhk));
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select Plot Size" />
                </SelectTrigger>
                <SelectContent>
                  {PLOT_PRESETS.map((p) => (
                    <SelectItem key={`${p.w}x${p.d}`} value={`${p.w}x${p.d}`}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Exact Plot Width & Depth Controls */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">Width (ft)</span>
                  <Input
                    type="number"
                    min={15}
                    max={120}
                    value={plotWidth}
                    onChange={(e) => {
                      const w = Math.max(15, Number(e.target.value) || 15);
                      setPlotWidth(w);
                      setPlanName(formatHousePlanTitle(w, plotDepth, builtUpArea, bhk));
                    }}
                    className="h-7 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground">Depth (ft)</span>
                  <Input
                    type="number"
                    min={20}
                    max={150}
                    value={plotDepth}
                    onChange={(e) => {
                      const d = Math.max(20, Number(e.target.value) || 20);
                      setPlotDepth(d);
                      setPlanName(formatHousePlanTitle(plotWidth, d, builtUpArea, bhk));
                    }}
                    className="h-7 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 2. Target Built-up Size */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="builtUp" className="text-xs font-semibold">
                  Built-up Size
                </Label>
                <span className="text-[10px] font-mono text-primary">
                  {Math.min(100, Math.round((builtUpArea / (plotWidth * plotDepth)) * 100))}% Ground Coverage
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="builtUp"
                  type="number"
                  min={400}
                  max={plotWidth * plotDepth * 2}
                  value={builtUpArea}
                  onChange={(e) => {
                    const b = Math.max(400, Number(e.target.value) || 400);
                    setBuiltUpArea(b);
                    setPlanName(formatHousePlanTitle(plotWidth, plotDepth, b, bhk));
                  }}
                  className="h-8 text-xs font-mono"
                />
                <span className="text-xs text-muted-foreground shrink-0">sq ft</span>
              </div>
            </div>

            {/* 3. Configuration (BHK) & Plot Facing */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Configuration</Label>
                <Select
                  value={String(bhk)}
                  onValueChange={(v) => {
                    const newBhk = Number(v);
                    setBhk(newBhk);
                    setPlanName(formatHousePlanTitle(plotWidth, plotDepth, builtUpArea, newBhk));
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 BHK</SelectItem>
                    <SelectItem value="2">2 BHK</SelectItem>
                    <SelectItem value="3">3 BHK</SelectItem>
                    <SelectItem value="4">4 BHK</SelectItem>
                    <SelectItem value="5">5 BHK</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Plot Facing</Label>
                <Select value={facing} onValueChange={setFacing}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="North">North Facing</SelectItem>
                    <SelectItem value="East">East Facing</SelectItem>
                    <SelectItem value="North-East">North-East</SelectItem>
                    <SelectItem value="South">South Facing</SelectItem>
                    <SelectItem value="West">West Facing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 4. Instructions & Design Requirements */}
            <div className="space-y-1.5">
              <Label htmlFor="brief" className="text-xs font-semibold flex items-center justify-between">
                <span>Specific Instructions</span>
              </Label>
              <Textarea
                id="brief"
                rows={3}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="North-facing main door, puja in NE corner, parking with car bay, attached toilets, sit-out..."
                className="text-xs leading-relaxed"
              />

              {/* Quick Suggestion Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {INSTRUCTION_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (!brief.includes(tag)) {
                        setBrief((prev) => (prev ? `${prev}, ${tag}` : tag));
                      }
                    }}
                    className="text-[9px] rounded bg-secondary/80 hover:bg-secondary border border-border/60 px-1.5 py-0.5 text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              className="w-full h-9 font-semibold gap-1.5 shadow-sm"
              onClick={runGenerate}
              disabled={generate.isPending || !canAffordPlan}
            >
              {generate.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Generate Floor Plan
            </Button>
          </div>

          {/* Vastu Shastra Score Card */}
          <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
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
                ? `Excellent Vastu alignment for ${facing} facing layout with Master Suite in SW and Kitchen in SE (Agneya).`
                : "Master bedroom or kitchen can be repositioned to South-West / South-East for higher Vastu energy."}
            </p>
          </div>

          {/* Curated Real-World Architectural Templates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="label-caps">Curated Templates</p>
              <Badge variant="outline" className="text-[9px]">
                {templates.length} Designs
              </Badge>
            </div>
            <div className="flex flex-col gap-1.5">
              {templates.map((t) => (
                <Button
                  key={t.name}
                  variant="outline"
                  size="sm"
                  className="justify-between text-xs font-medium h-9 text-left px-2.5"
                  onClick={() => {
                    setRooms(t.rooms);
                    setSelected(t.rooms[0]?.id ?? null);
                    setBhk(t.bhk);
                    setPlotWidth(t.plotWidth);
                    setPlotDepth(t.plotDepth);
                    setBuiltUpArea(t.builtUp);
                    setPlanId(null);
                    setPlanName(formatHousePlanTitle(t.plotWidth, t.plotDepth, t.builtUp, t.bhk));
                    setRender3DResult(null);
                    toast.success(`Loaded ${t.name}`, {
                      description: `Plot: ${t.plotWidth}' × ${t.plotDepth}' · Built-up: ${t.builtUp} sq ft`,
                    });
                  }}
                >
                  <span className="truncate">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-1.5 bg-secondary/80 px-1 py-0.5 rounded">
                    {t.plotWidth}′×{t.plotDepth}′
                  </span>
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={addRoom} className="text-xs mt-1">
                <Plus className="size-4 mr-1" /> Add Custom Room
              </Button>
            </div>
          </div>
        </aside>

        {/* Center: Color Architectural Canvas */}
        <section className="surface-panel overflow-auto p-4 flex flex-col">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <Label htmlFor="planName" className="text-xs text-muted-foreground">
                House Plan Title
              </Label>
              <Input
                id="planName"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="h-8 font-bold text-sm uppercase tracking-wide"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">
                Plot: {plotWidth}′ × {plotDepth}′ ({plotWidth * plotDepth} sq ft)
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono text-primary font-semibold">
                Built-up: {totalArea} sq ft
              </Badge>
            </div>
          </div>

          <div className="flex-1 min-h-[480px] grid place-items-center rounded-lg border border-border p-4 relative overflow-hidden bg-[#f1f5f9] dark:bg-[#0b1329]">
            {/* Vastu Compass Indicator Badge */}
            <div className="absolute top-6 right-6 z-10 backdrop-blur border rounded-md p-2 shadow-sm pointer-events-none flex flex-col items-center bg-white/95 border-slate-300 text-slate-800 dark:bg-slate-900/95 dark:border-slate-700 dark:text-slate-200">
              <Compass className="size-5 text-primary animate-pulse" />
              <span className="text-[9px] font-bold tracking-widest mt-0.5">{facing.toUpperCase()} ↑</span>
            </div>

            <svg
              ref={svgRef}
              viewBox={`-4 -6 ${maxX + 8} ${maxY + 10}`}
              xmlns="http://www.w3.org/2000/svg"
              className="w-full max-w-2xl rounded-lg shadow-2xl select-none"
              style={{
                minHeight: `${500 * zoom}px`,
                backgroundColor: "#ffffff",
              }}
              role="img"
              aria-label="Architectural Presentation Floor Plan"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <defs>
                {/* Wood plank texture for bedrooms */}
                <pattern
                  id="wood-floor"
                  width="4"
                  height="2"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(0)"
                >
                  <rect width="4" height="2" fill="#f7eee6" />
                  <line x1="0" y1="2" x2="4" y2="2" stroke="#e2d4c7" strokeWidth="0.08" />
                  <line x1="2" y1="0" x2="2" y2="2" stroke="#e2d4c7" strokeWidth="0.08" />
                </pattern>

                {/* Marble Tile pattern for Living & Dining */}
                <pattern id="marble-tile" width="3" height="3" patternUnits="userSpaceOnUse">
                  <rect width="3" height="3" fill="#fcfaf7" />
                  <path d="M 3 0 L 0 0 0 3" fill="none" stroke="#e7e0d6" strokeWidth="0.06" />
                </pattern>

                {/* Bathroom Ceramic Tile pattern */}
                <pattern id="bath-tile" width="1.5" height="1.5" patternUnits="userSpaceOnUse">
                  <rect width="1.5" height="1.5" fill="#f1f5f9" />
                  <path d="M 1.5 0 L 0 0 0 1.5" fill="none" stroke="#cbd5e1" strokeWidth="0.05" />
                </pattern>

                {/* Parking Interlocking Pavers */}
                <pattern id="parking-paver" width="2" height="1" patternUnits="userSpaceOnUse">
                  <rect width="2" height="1" fill="#e2e8f0" />
                  <path
                    d="M 0 1 L 2 1 M 1 0 L 1 1"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="0.08"
                  />
                </pattern>

                {/* Sit-out Deck Texture */}
                <pattern id="sitout-deck" width="5" height="0.8" patternUnits="userSpaceOnUse">
                  <rect width="5" height="0.8" fill="#e2e8f0" />
                  <line x1="0" y1="0.8" x2="5" y2="0.8" stroke="#cbd5e1" strokeWidth="0.06" />
                </pattern>

                {/* Drop shadow filter for furniture */}
                <filter id="furniture-shadow" x="-10%" y="-10%" width="125%" height="125%">
                  <feDropShadow
                    dx="0.2"
                    dy="0.3"
                    stdDeviation="0.25"
                    floodColor="#0f172a"
                    floodOpacity="0.18"
                  />
                </filter>
              </defs>

              {/* Background */}
              <rect x="-4" y="-6" width={maxX + 8} height={maxY + 10} fill="#ffffff" />

              {/* Title Header on presentation plan */}
              <text
                x={maxX / 2}
                y="-4.1"
                textAnchor="middle"
                fill="#c2410c"
                fontSize={2.1}
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="0.04em"
              >
                {planName.toUpperCase()}
              </text>
              <text
                x={maxX / 2}
                y="-2.8"
                textAnchor="middle"
                fill="#334155"
                fontSize={1.05}
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="0.03em"
              >
                PLOT: {plotWidth}′0″ × {plotDepth}′0″ ({plotWidth * plotDepth} SQ. FT.)   |   BUILT-UP: {totalArea} SQ. FT.
              </text>

              {/* Outer Dimension Lines & Markers */}
              {/* Top Width Dimension: e.g. 30'-0" */}
              <g opacity={0.85}>
                <line
                  x1="0"
                  y1="-1.6"
                  x2={maxX}
                  y2="-1.6"
                  stroke="#475569"
                  strokeWidth="0.18"
                />
                <circle cx="0" cy="-1.6" r="0.3" fill="#0f172a" />
                <circle cx={maxX} cy="-1.6" r="0.3" fill="#0f172a" />
                <rect
                  x={maxX / 2 - 3}
                  y="-2.4"
                  width="6"
                  height="1.5"
                  fill="#ffffff"
                />
                <text
                  x={maxX / 2}
                  y="-1.3"
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize={1.2}
                  fontWeight="bold"
                  fontFamily="system-ui, sans-serif"
                >
                  {maxX}′-0″
                </text>
              </g>

              {/* Left Height Dimension: e.g. 50'-0" */}
              <g opacity={0.85}>
                <line
                  x1="-1.8"
                  y1="0"
                  x2="-1.8"
                  y2={maxY}
                  stroke="#475569"
                  strokeWidth="0.18"
                />
                <circle cx="-1.8" cy="0" r="0.3" fill="#0f172a" />
                <circle cx="-1.8" cy={maxY} r="0.3" fill="#0f172a" />
                <rect
                  x="-2.6"
                  y={maxY / 2 - 3}
                  width="1.6"
                  height="6"
                  fill="#ffffff"
                />
                <text
                  x="-1.5"
                  y={maxY / 2}
                  textAnchor="middle"
                  fill="#0f172a"
                  fontSize={1.2}
                  fontWeight="bold"
                  fontFamily="system-ui, sans-serif"
                  transform={`rotate(-90 -1.5 ${maxY / 2})`}
                >
                  {maxY}′-0″
                </text>
              </g>

              {/* Outer Perimeter Frame */}
              <rect
                x="0"
                y="0"
                width={maxX}
                height={maxY}
                fill="none"
                stroke="#0f172a"
                strokeWidth={0.7}
              />

              {/* --- RENDER ROOMS & FURNITURE --- */}
              {rooms.map((r) => {
                const active = r.id === selected;
                const rType = r.type || inferRoomType(r.name);
                const theme = ROOM_THEMES[rType] || ROOM_THEMES.bedroom;

                // Floor texture selection
                let floorFill = theme.bgColor;
                if (rType === "master_bedroom" || rType === "bedroom")
                  floorFill = "url(#wood-floor)";
                else if (rType === "living" || rType === "dining" || rType === "foyer")
                  floorFill = "url(#marble-tile)";
                else if (rType === "bathroom" || rType === "utility")
                  floorFill = "url(#bath-tile)";
                else if (rType === "parking") floorFill = "url(#parking-paver)";
                else if (rType === "sitout") floorFill = "url(#sitout-deck)";

                return (
                  <g
                    key={r.id}
                    className="cursor-move group"
                    onPointerDown={(e) => handlePointerDown(e, r)}
                  >
                    {/* Room Floor Base */}
                    <rect
                      x={r.x}
                      y={r.y}
                      width={r.w}
                      height={r.h}
                      fill={floorFill}
                      stroke={active ? "#38bdf8" : "#1e293b"}
                      strokeWidth={active ? 0.8 : 0.6}
                    />

                    {/* --- DETAILED TOP-DOWN FURNITURE STAGING --- */}
                    {rType === "master_bedroom" || rType === "bedroom" ? (
                      /* Realistic Bed & Nightstands Staging */
                      <g
                        filter="url(#furniture-shadow)"
                        transform={`translate(${r.x + r.w / 2 - 2.8}, ${r.y + 1})`}
                      >
                        {/* Bed Carpet/Rug Underneath */}
                        <rect
                          x="-0.8"
                          y="1.2"
                          width="7.2"
                          height="6.8"
                          rx="0.3"
                          fill="#d6ccc2"
                          opacity={0.65}
                        />

                        {/* Wooden Headboard */}
                        <rect
                          x="0"
                          y="0"
                          width="5.6"
                          height="0.6"
                          rx="0.15"
                          fill="#8c532b"
                          stroke="#5c3d2e"
                          strokeWidth="0.1"
                        />

                        {/* Mattress Base */}
                        <rect
                          x="0.3"
                          y="0.6"
                          width="5.0"
                          height="6.0"
                          rx="0.3"
                          fill="#fdfbf7"
                          stroke="#d5bdaf"
                          strokeWidth="0.12"
                        />

                        {/* Pillows */}
                        <rect
                          x="0.6"
                          y="0.8"
                          width="1.9"
                          height="1.2"
                          rx="0.25"
                          fill="#ffffff"
                          stroke="#cbd5e1"
                          strokeWidth="0.08"
                        />
                        <rect
                          x="3.1"
                          y="0.8"
                          width="1.9"
                          height="1.2"
                          rx="0.25"
                          fill="#ffffff"
                          stroke="#cbd5e1"
                          strokeWidth="0.08"
                        />

                        {/* Folded Duvet / Blanket Cover */}
                        <rect
                          x="0.3"
                          y="2.8"
                          width="5.0"
                          height="3.8"
                          rx="0.2"
                          fill="#e8dfd8"
                          stroke="#b7b7a4"
                          strokeWidth="0.1"
                        />
                        <line
                          x1="0.3"
                          y1="2.8"
                          x2="5.3"
                          y2="2.8"
                          stroke="#a5a58d"
                          strokeWidth="0.15"
                        />

                        {/* Left & Right Nightstands */}
                        <g transform="translate(-1.1, 0.2)">
                          <rect
                            x="0"
                            y="0"
                            width="1.0"
                            height="1.1"
                            rx="0.1"
                            fill="#a2673f"
                            stroke="#5c3d2e"
                            strokeWidth="0.08"
                          />
                          <circle cx="0.5" cy="0.55" r="0.25" fill="#fef08a" opacity={0.8} />
                        </g>
                        <g transform="translate(5.7, 0.2)">
                          <rect
                            x="0"
                            y="0"
                            width="1.0"
                            height="1.1"
                            rx="0.1"
                            fill="#a2673f"
                            stroke="#5c3d2e"
                            strokeWidth="0.08"
                          />
                          <circle cx="0.5" cy="0.55" r="0.25" fill="#fef08a" opacity={0.8} />
                        </g>
                      </g>
                    ) : rType === "living" ? (
                      /* Realistic Living Room Lounge Staging (Sofa, Coffee Table, TV Unit, Plants) */
                      <g
                        filter="url(#furniture-shadow)"
                        transform={`translate(${r.x + 1.2}, ${r.y + 1.2})`}
                      >
                        {/* Area Rug */}
                        <rect
                          x="1.5"
                          y="1.0"
                          width="8.0"
                          height="8.0"
                          rx="0.4"
                          fill="#ede8e1"
                          stroke="#ded6ca"
                          strokeWidth="0.1"
                        />

                        {/* 3-Seater Main Sofa */}
                        <g transform="translate(7.2, 2.0)">
                          <rect
                            x="0"
                            y="0"
                            width="2.2"
                            height="6.0"
                            rx="0.3"
                            fill="#e5e7eb"
                            stroke="#9ca3af"
                            strokeWidth="0.12"
                          />
                          {/* Cushions */}
                          <line
                            x1="0"
                            y1="2.0"
                            x2="2.2"
                            y2="2.0"
                            stroke="#cbd5e1"
                            strokeWidth="0.1"
                          />
                          <line
                            x1="0"
                            y1="4.0"
                            x2="2.2"
                            y2="4.0"
                            stroke="#cbd5e1"
                            strokeWidth="0.1"
                          />
                        </g>

                        {/* Top Armchairs */}
                        <g transform="translate(2.5, 0.8)">
                          <rect
                            x="0"
                            y="0"
                            width="2.2"
                            height="1.8"
                            rx="0.2"
                            fill="#e5e7eb"
                            stroke="#9ca3af"
                            strokeWidth="0.1"
                          />
                        </g>

                        {/* Bottom Armchairs */}
                        <g transform="translate(2.5, 7.4)">
                          <rect
                            x="0"
                            y="0"
                            width="2.2"
                            height="1.8"
                            rx="0.2"
                            fill="#e5e7eb"
                            stroke="#9ca3af"
                            strokeWidth="0.1"
                          />
                        </g>

                        {/* Center Coffee Table */}
                        <g transform="translate(3.5, 3.5)">
                          <rect
                            x="0"
                            y="0"
                            width="2.4"
                            height="3.0"
                            rx="0.2"
                            fill="#a16207"
                            stroke="#713f12"
                            strokeWidth="0.1"
                          />
                          <rect
                            x="0.3"
                            y="0.3"
                            width="1.8"
                            height="2.4"
                            rx="0.1"
                            fill="#d97706"
                            opacity={0.3}
                          />
                        </g>

                        {/* TV Console Unit on Left Wall */}
                        <rect
                          x="0"
                          y="2.5"
                          width="0.8"
                          height="5.0"
                          rx="0.1"
                          fill="#78350f"
                          stroke="#451a03"
                          strokeWidth="0.1"
                        />

                        {/* Potted Indoor Plants */}
                        <g transform="translate(8.2, 0.8)">
                          <circle cx="0.5" cy="0.5" r="0.6" fill="#15803d" />
                          <circle cx="0.5" cy="0.5" r="0.4" fill="#22c55e" />
                          <circle cx="0.5" cy="0.5" r="0.2" fill="#86efac" />
                        </g>
                        <g transform="translate(8.2, 8.4)">
                          <circle cx="0.5" cy="0.5" r="0.6" fill="#15803d" />
                          <circle cx="0.5" cy="0.5" r="0.4" fill="#22c55e" />
                          <circle cx="0.5" cy="0.5" r="0.2" fill="#86efac" />
                        </g>
                      </g>
                    ) : rType === "dining" ? (
                      /* Realistic 6-Seater Dining Table Staging */
                      <g
                        filter="url(#furniture-shadow)"
                        transform={`translate(${r.x + r.w / 2 - 2.5}, ${r.y + r.h / 2 - 2.5})`}
                      >
                        {/* Table */}
                        <rect
                          x="0.8"
                          y="0.8"
                          width="3.4"
                          height="3.4"
                          rx="0.3"
                          fill="#9a3412"
                          stroke="#7c2d12"
                          strokeWidth="0.12"
                        />
                        {/* Chairs (Top, Bottom, Left, Right) */}
                        <rect
                          x="1.3"
                          y="0"
                          width="1.0"
                          height="0.7"
                          rx="0.15"
                          fill="#c2410c"
                        />
                        <rect
                          x="2.7"
                          y="0"
                          width="1.0"
                          height="0.7"
                          rx="0.15"
                          fill="#c2410c"
                        />
                        <rect
                          x="1.3"
                          y="4.3"
                          width="1.0"
                          height="0.7"
                          rx="0.15"
                          fill="#c2410c"
                        />
                        <rect
                          x="2.7"
                          y="4.3"
                          width="1.0"
                          height="0.7"
                          rx="0.15"
                          fill="#c2410c"
                        />
                        <rect
                          x="0"
                          y="1.8"
                          width="0.7"
                          height="1.4"
                          rx="0.15"
                          fill="#c2410c"
                        />
                        <rect
                          x="4.3"
                          y="1.8"
                          width="0.7"
                          height="1.4"
                          rx="0.15"
                          fill="#c2410c"
                        />
                      </g>
                    ) : rType === "kitchen" ? (
                      /* Modular Kitchen Counter with Double Sink & 4-Burner Hob */
                      <g
                        filter="url(#furniture-shadow)"
                        transform={`translate(${r.x + 0.4}, ${r.y + 0.4})`}
                      >
                        {/* L-shaped Countertop */}
                        <path
                          d={`M 0 0 L ${Math.max(2, r.w - 0.8)} 0 L ${Math.max(2, r.w - 0.8)} 2.2 L 2.2 2.2 L 2.2 ${Math.max(2, r.h - 0.8)} L 0 ${Math.max(2, r.h - 0.8)} Z`}
                          fill="#334155"
                          stroke="#1e293b"
                          strokeWidth="0.15"
                        />
                        {/* 4-Burner Hob */}
                        <g transform="translate(0.5, 4.0)">
                          <rect
                            x="0"
                            y="0"
                            width="1.4"
                            height="2.0"
                            rx="0.15"
                            fill="#0f172a"
                            stroke="#f59e0b"
                            strokeWidth="0.08"
                          />
                          <circle cx="0.45" cy="0.5" r="0.25" fill="#f59e0b" />
                          <circle cx="0.95" cy="0.5" r="0.25" fill="#f59e0b" />
                          <circle cx="0.45" cy="1.5" r="0.25" fill="#f59e0b" />
                          <circle cx="0.95" cy="1.5" r="0.25" fill="#f59e0b" />
                        </g>
                        {/* Double Sink */}
                        <g transform={`translate(${Math.max(3, r.w - 3.8)}, 0.4)`}>
                          <rect
                            x="0"
                            y="0"
                            width="1.4"
                            height="1.2"
                            rx="0.1"
                            fill="#e2e8f0"
                            stroke="#64748b"
                            strokeWidth="0.08"
                          />
                          <rect
                            x="1.6"
                            y="0"
                            width="1.4"
                            height="1.2"
                            rx="0.1"
                            fill="#e2e8f0"
                            stroke="#64748b"
                            strokeWidth="0.08"
                          />
                          <circle cx="1.5" cy="0.6" r="0.15" fill="#3b82f6" />
                        </g>
                      </g>
                    ) : rType === "bathroom" ? (
                      /* Toilet Commode, Vanity Basin & Shower */
                      <g
                        filter="url(#furniture-shadow)"
                        transform={`translate(${r.x + 0.6}, ${r.y + 0.6})`}
                      >
                        {/* Commode */}
                        <g transform="translate(0.5, 0.4)">
                          <rect
                            x="0"
                            y="0"
                            width="1.8"
                            height="0.8"
                            rx="0.1"
                            fill="#ffffff"
                            stroke="#64748b"
                            strokeWidth="0.1"
                          />
                          <ellipse
                            cx="0.9"
                            cy="1.4"
                            rx="0.75"
                            ry="0.85"
                            fill="#ffffff"
                            stroke="#64748b"
                            strokeWidth="0.1"
                          />
                        </g>
                        {/* Washbasin */}
                        <g transform={`translate(${Math.max(2, r.w - 2.4)}, 0.4)`}>
                          <rect
                            x="0"
                            y="0"
                            width="1.4"
                            height="1.2"
                            rx="0.2"
                            fill="#ffffff"
                            stroke="#64748b"
                            strokeWidth="0.1"
                          />
                          <circle cx="0.7" cy="0.6" r="0.25" fill="#38bdf8" />
                        </g>
                      </g>
                    ) : rType === "parking" ? (
                      /* Realistic Metallic Car Model in Parking */
                      <g
                        filter="url(#furniture-shadow)"
                        transform={`translate(${r.x + r.w / 2 - 2.8}, ${r.y + 1.2})`}
                      >
                        {/* Parking Bay Guideline */}
                        <rect
                          x="-0.6"
                          y="0"
                          width="6.8"
                          height="11.5"
                          fill="none"
                          stroke="#cbd5e1"
                          strokeWidth="0.15"
                          strokeDasharray="0.6, 0.4"
                        />

                        {/* Car Tires */}
                        <rect x="0.1" y="1.2" width="0.6" height="1.6" rx="0.2" fill="#0f172a" />
                        <rect x="4.9" y="1.2" width="0.6" height="1.6" rx="0.2" fill="#0f172a" />
                        <rect x="0.1" y="8.0" width="0.6" height="1.6" rx="0.2" fill="#0f172a" />
                        <rect x="4.9" y="8.0" width="0.6" height="1.6" rx="0.2" fill="#0f172a" />

                        {/* Car Body (Aerodynamic Modern Sedan) */}
                        <path
                          d="M 1.2 0.8 Q 2.8 0.2 4.4 0.8 Q 5.2 1.8 5.2 8.8 Q 4.8 10.4 2.8 10.4 Q 0.8 10.4 0.4 8.8 Q 0.4 1.8 1.2 0.8 Z"
                          fill="#cbd5e1"
                          stroke="#64748b"
                          strokeWidth="0.15"
                        />

                        {/* Front Windshield */}
                        <path
                          d="M 1.0 2.4 L 4.6 2.4 L 4.2 3.8 L 1.4 3.8 Z"
                          fill="#1e293b"
                          stroke="#0f172a"
                          strokeWidth="0.08"
                        />

                        {/* Panoramic Sunroof / Roof */}
                        <rect
                          x="1.4"
                          y="4.1"
                          width="2.8"
                          height="2.6"
                          rx="0.2"
                          fill="#334155"
                          stroke="#1e293b"
                          strokeWidth="0.08"
                        />

                        {/* Rear Windshield */}
                        <path
                          d="M 1.4 7.0 L 4.2 7.0 L 4.6 8.2 L 1.0 8.2 Z"
                          fill="#1e293b"
                          stroke="#0f172a"
                          strokeWidth="0.08"
                        />

                        {/* Headlights & Taillights */}
                        <ellipse cx="1.0" cy="0.8" rx="0.3" ry="0.15" fill="#fef08a" />
                        <ellipse cx="4.6" cy="0.8" rx="0.3" ry="0.15" fill="#fef08a" />
                        <rect x="0.8" y="10.0" width="0.8" height="0.25" rx="0.1" fill="#ef4444" />
                        <rect x="4.0" y="10.0" width="0.8" height="0.25" rx="0.1" fill="#ef4444" />

                        {/* Side Mirrors */}
                        <rect
                          x="-0.2"
                          y="2.4"
                          width="0.5"
                          height="0.3"
                          rx="0.1"
                          fill="#cbd5e1"
                        />
                        <rect
                          x="5.3"
                          y="2.4"
                          width="0.5"
                          height="0.3"
                          rx="0.1"
                          fill="#cbd5e1"
                        />
                      </g>
                    ) : rType === "staircase" ? (
                      /* Staircase with Riser Steps & UP Arrow */
                      <g transform={`translate(${r.x + 0.4}, ${r.y + 0.4})`}>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <line
                            key={i}
                            x1="0"
                            y1={i * 1.3}
                            x2={r.w - 0.8}
                            y2={i * 1.3}
                            stroke="#64748b"
                            strokeWidth="0.12"
                          />
                        ))}
                        {/* UP Direction Indicator */}
                        <text
                          x={(r.w - 0.8) / 2}
                          y={r.h / 2}
                          textAnchor="middle"
                          fill="#0f172a"
                          fontSize={1.0}
                          fontWeight="bold"
                        >
                          UP ↑
                        </text>
                      </g>
                    ) : rType === "sitout" ? (
                      /* Sit-out Outdoor Armchairs & Plant Shrubs */
                      <g
                        filter="url(#furniture-shadow)"
                        transform={`translate(${r.x + 1.2}, ${r.y + 1.2})`}
                      >
                        {/* 2 Armchairs & Round Table */}
                        <circle
                          cx="1.2"
                          cy="3.0"
                          r="1.0"
                          fill="#a16207"
                          stroke="#713f12"
                          strokeWidth="0.1"
                        />
                        <circle
                          cx="3.2"
                          cy="3.0"
                          r="0.6"
                          fill="#d97706"
                          stroke="#92400e"
                          strokeWidth="0.1"
                        />
                        <circle
                          cx="5.2"
                          cy="3.0"
                          r="1.0"
                          fill="#a16207"
                          stroke="#713f12"
                          strokeWidth="0.1"
                        />

                        {/* Shrubs and Potted Bushes */}
                        <g transform="translate(0, -0.4)">
                          <circle cx="1.0" cy="0.4" r="0.6" fill="#15803d" />
                          <circle cx="2.5" cy="0.4" r="0.6" fill="#16a34a" />
                          <circle cx="4.0" cy="0.4" r="0.6" fill="#22c55e" />
                          <circle cx="5.5" cy="0.4" r="0.6" fill="#15803d" />
                        </g>
                      </g>
                    ) : rType === "pooja" ? (
                      /* Puja Room Sacred Altar */
                      <g
                        filter="url(#furniture-shadow)"
                        transform={`translate(${r.x + r.w / 2 - 1.2}, ${r.y + 0.8})`}
                      >
                        <rect
                          x="0"
                          y="0"
                          width="2.4"
                          height="1.8"
                          rx="0.2"
                          fill="#b45309"
                          stroke="#eab308"
                          strokeWidth="0.12"
                        />
                        <circle cx="1.2" cy="0.9" r="0.45" fill="#facc15" />
                      </g>
                    ) : null}

                    {/* Architectural Door Swing Arc */}
                    <g
                      opacity={0.8}
                      transform={`translate(${r.x + 0.3}, ${r.y + Math.min(r.h - 0.3, 4)})`}
                    >
                      <path
                        d="M 0 0 A 2.2 2.2 0 0 1 2.2 -2.2"
                        fill="none"
                        stroke="#475569"
                        strokeWidth="0.12"
                        strokeDasharray="0.3, 0.2"
                      />
                      <line
                        x1="0"
                        y1="0"
                        x2="2.2"
                        y2="0"
                        stroke="#0f172a"
                        strokeWidth="0.2"
                      />
                    </g>

                    {/* Window Symbol on Top Edge */}
                    <g opacity={0.85} transform={`translate(${r.x + r.w / 2 - 1.5}, ${r.y})`}>
                      <line
                        x1="0"
                        y1="0"
                        x2="3"
                        y2="0"
                        stroke="#0284c7"
                        strokeWidth="0.3"
                      />
                    </g>

                    {/* Room Label Typography */}
                    <g
                      className="pointer-events-none select-none"
                      transform={`translate(${r.x + r.w / 2}, ${
                        rType === "parking"
                          ? r.y + 2.0
                          : rType === "kitchen"
                            ? r.y + r.h / 2 + 1.8
                            : r.y + r.h / 2 + 1.2
                      })`}
                    >
                      {/* White backing for pristine readability */}
                      <rect
                        x="-4"
                        y="-1.1"
                        width="8"
                        height="2.4"
                        rx="0.25"
                        fill="#ffffff"
                        opacity={0.88}
                      />
                      <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize={1.15}
                        fontWeight="800"
                        fontFamily="system-ui, -apple-system, sans-serif"
                        letterSpacing="0.04em"
                      >
                        {r.name.toUpperCase()}
                      </text>
                      <text
                        x="0"
                        y="1.0"
                        textAnchor="middle"
                        fill="#475569"
                        fontSize={0.85}
                        fontWeight="600"
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        {r.w}′0″ × {r.h}′0″
                      </text>
                    </g>

                    {/* Active Selection Glow Ring */}
                    {active && (
                      <rect
                        x={r.x - 0.2}
                        y={r.y - 0.2}
                        width={r.w + 0.4}
                        height={r.h + 0.4}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth={0.35}
                        strokeDasharray="0.8, 0.4"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Architectural Drawing Title Block Footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <CheckCircle2 className="size-3.5 text-emerald-500" /> 2D Colored Architectural Plan
              </span>
              <span>
                Plot: <strong className="text-foreground font-mono">{plotWidth}′ × {plotDepth}′</strong> ({plotWidth * plotDepth} sq ft)
              </span>
              <span>
                Built-up: <strong className="text-primary font-mono font-semibold">{totalArea} sq ft</strong> ({Math.round((totalArea / (plotWidth * plotDepth)) * 100)}% Coverage)
              </span>
              <span>
                Facing: <strong className="text-foreground">{facing}</strong>
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
                      <SelectItem value="bathroom">Toilet / Bathroom</SelectItem>
                      <SelectItem value="pooja">Puja Room</SelectItem>
                      <SelectItem value="foyer">Entrance Foyer</SelectItem>
                      <SelectItem value="utility">Utility & Wash</SelectItem>
                      <SelectItem value="parking">Car Parking Bay</SelectItem>
                      <SelectItem value="staircase">Staircase Core</SelectItem>
                      <SelectItem value="sitout">Sit Out / Deck</SelectItem>
                      <SelectItem value="balcony">Balcony</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="rw" className="text-xs">
                      Width (ft)
                    </Label>
                    <Input
                      id="rw"
                      type="number"
                      min={3}
                      max={60}
                      value={selectedRoom.w}
                      onChange={(e) => update({ w: Math.max(3, Number(e.target.value) || 3) })}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rh" className="text-xs">
                      Length (ft)
                    </Label>
                    <Input
                      id="rh"
                      type="number"
                      min={3}
                      max={60}
                      value={selectedRoom.h}
                      onChange={(e) => update({ h: Math.max(3, Number(e.target.value) || 3) })}
                      className="h-8 text-xs font-mono"
                    />
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
            <div className="flex items-center justify-between">
              <p className="label-caps">Saved Floor Plans</p>
              <Badge variant="outline" className="text-[10px]">
                {savedPlans.length} plans
              </Badge>
            </div>
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
                        const newTotal = typedRooms.reduce((sum, r) => sum + r.w * r.h, 0);
                        setRooms(typedRooms);
                        setSelected(typedRooms[0]?.id ?? null);
                        setPlanId(p.id);
                        setBuiltUpArea(newTotal);
                        setPlanName(p.prompt || "Untitled plan");
                        if (p.settings?.bhk) setBhk(p.settings.bhk);
                        if (p.settings?.plot) {
                          const parts = p.settings.plot.replace(/ft/g, "").split("x").map((s) => Number(s.trim()));
                          if (parts[0]) setPlotWidth(parts[0]);
                          if (parts[1]) setPlotDepth(parts[1]);
                        }
                        if (p.settings?.style3D) setStyle3D(p.settings.style3D);
                        if (p.settings?.materialPalette) setMaterialPalette(p.settings.materialPalette);
                        setRender3DResult(p.settings?.render3d_url || null);
                        toast.info(`Loaded plan: ${p.prompt || "Untitled plan"}`);
                      }}
                    >
                      <div className="truncate font-medium">{p.prompt || "Untitled plan"}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span>{p.settings?.plot || `${p.rooms.length} rooms`}</span>
                        {p.settings?.render3d_url && <span className="text-primary">· 3D</span>}
                      </div>
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

      {/* --- 3D ISOMETRIC CUTAWAY AI VISUALIZER MODAL --- */}
      <Dialog open={render3DOpen} onOpenChange={setRender3DOpen}>
        <DialogContent className="max-w-4xl bg-background/95 backdrop-blur p-4 sm:p-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Box className="size-5 text-primary" /> 3D Isometric Architectural Cutaway
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Photorealistic 3D architectural render generated directly from your 2D space plan ({bhk} BHK, {plotStr}).
          </DialogDescription>

          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary/30 p-3 rounded-lg border border-border/60">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium">Style:</Label>
                  <Select value={style3D} onValueChange={setStyle3D}>
                    <SelectTrigger className="h-8 text-xs w-44">
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

                <div className="flex items-center gap-2">
                  <Label className="text-xs font-medium">Material Palette:</Label>
                  <Select value={materialPalette} onValueChange={setMaterialPalette}>
                    <SelectTrigger className="h-8 text-xs w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_PALETTES.map((mat) => (
                        <SelectItem key={mat.id} value={mat.id}>
                          {mat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleRender3D}
                disabled={render3D.isPending || !canAffordRender}
                className="h-8 text-xs ml-auto"
              >
                {render3D.isPending ? (
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                ) : (
                  <RefreshCw className="size-3.5 mr-1.5" />
                )}
                {render3DResult ? "Re-synthesize 3D Model" : "Generate 3D Cutaway"}
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
                    Translating 2D room boundaries into 3D furnished architectural geometry with{" "}
                    {MATERIAL_PALETTES.find((p) => p.id === materialPalette)?.label}
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-2 p-6">
                  <Box className="mx-auto size-8 text-muted-foreground/60" />
                  <p className="text-xs text-muted-foreground">
                    Click "Generate 3D Cutaway" to synthesize the 3D model.
                  </p>
                </div>
              )}
            </div>

            {render3DResult && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <Badge variant="outline" className="text-[10px]">
                  16:9 8K UHD Architectural 3D Cutaway · Grounded to {rooms.length} Active Rooms
                </Badge>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSheetData({
                        url: render3DResult,
                        title: `${planName} · 3D Cutaway`,
                        tool: "Floor Plan 3D",
                        prompt: `3D Isometric floor plan cutaway layout for ${bhk} BHK (${plotStr}). Material finishes: ${MATERIAL_PALETTES.find((p) => p.id === materialPalette)?.desc}`,
                      });
                      setSheetOpen(true);
                    }}
                  >
                    <FileText className="size-4 mr-1.5" /> Presentation Sheet
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={render3DResult}
                      download="3d-isometric-floorplan.png"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download className="size-4 mr-1.5" /> Download
                    </a>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => window.open(render3DResult, "_blank")}
                  >
                    <Maximize2 className="size-4 mr-1.5" /> Fullscreen
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* --- PRESENTATION SHEET MODAL --- */}
      {sheetData && (
        <PresentationSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          imageUrl={sheetData.url}
          title={sheetData.title}
          prompt={sheetData.prompt}
          tool={sheetData.tool}
          stylePreset={style3D}
          lightingMood="Natural Architectural Light"
          aspectRatio="16:9"
          authorName={creditProfile?.full_name ?? "ArchiGen Studio"}
        />
      )}
    </>
  );
}
