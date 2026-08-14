import heroVilla from "@/assets/hero-villa.jpg";
import sampleInterior from "@/assets/sample-interior.jpg";
import samplePlan from "@/assets/sample-plan.jpg";
import sampleExterior from "@/assets/sample-exterior.jpg";

export const images = { heroVilla, sampleInterior, samplePlan, sampleExterior };

export type Tool = {
  slug: string;
  to: string;
  name: string;
  blurb: string;
  credits: number;
  icon: string;
};

export const tools: Tool[] = [
  {
    slug: "architecture",
    to: "/architecture",
    name: "Architecture Generator",
    blurb: "Exterior concepts from a brief: plot, style, floors, materials.",
    credits: 4,
    icon: "Building2",
  },
  {
    slug: "interior",
    to: "/interior",
    name: "Interior Designer",
    blurb: "Furnished room concepts by style, palette and budget.",
    credits: 3,
    icon: "Sofa",
  },
  {
    slug: "redesign",
    to: "/redesign",
    name: "Room Redesign",
    blurb: "Upload a photo of your room and restyle it.",
    credits: 3,
    icon: "Wand2",
  },
  {
    slug: "floor-plan",
    to: "/floor-plan",
    name: "Floor Plan Studio",
    blurb: "Conceptual 1–4 BHK layouts you can edit room by room.",
    credits: 5,
    icon: "Ruler",
  },
];

export type Project = {
  id: string;
  title: string;
  type: "Architecture" | "Interior" | "Redesign" | "Floor Plan";
  updated: string;
  assets: number;
  favorite: boolean;
  cover: string;
};

export const projects: Project[] = [
  {
    id: "p1",
    title: "Coastal Villa — Alibaug",
    type: "Architecture",
    updated: "2 hours ago",
    assets: 12,
    favorite: true,
    cover: heroVilla,
  },
  {
    id: "p2",
    title: "Warm Minimal Living Room",
    type: "Interior",
    updated: "Yesterday",
    assets: 8,
    favorite: true,
    cover: sampleInterior,
  },
  {
    id: "p3",
    title: "3 BHK — 30x50 Plot",
    type: "Floor Plan",
    updated: "3 days ago",
    assets: 4,
    favorite: false,
    cover: samplePlan,
  },
  {
    id: "p4",
    title: "Urban Brick Facade",
    type: "Redesign",
    updated: "Last week",
    assets: 6,
    favorite: false,
    cover: sampleExterior,
  },
];

export const plans = [
  {
    name: "Starter",
    price: "₹0",
    period: "forever",
    credits: "25 credits / month",
    features: [
      "All four generators",
      "Watermarked downloads",
      "3 saved projects",
      "Community gallery",
    ],
    cta: "Current plan",
    featured: false,
  },
  {
    name: "Studio",
    price: "₹499",
    period: "per month",
    credits: "600 credits / month",
    features: [
      "High-resolution downloads",
      "Unlimited projects",
      "Editable floor plans",
      "AI assistant priority queue",
    ],
    cta: "Upgrade to Studio",
    featured: true,
  },
  {
    name: "Practice",
    price: "₹1,999",
    period: "per month",
    credits: "3,000 credits / month",
    features: ["Team seats (5)", "Client sharing links", "Brand presets", "Priority support"],
    cta: "Talk to us",
    featured: false,
  },
];

export const creditCosts = [
  { label: "Architecture render", cost: 4 },
  { label: "Interior render", cost: 3 },
  { label: "Room redesign", cost: 3 },
  { label: "Floor plan generation", cost: 5 },
  { label: "Text assistant reply", cost: 1 },
];

export const CONCEPTUAL_NOTE =
  "Conceptual output only — not an approved architectural, structural or construction drawing.";
