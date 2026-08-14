export const CONCEPT_GUARD =
  "These are conceptual visualisations only — not construction drawings and not structurally verified.";

export const STYLE_PRESETS: Record<string, string> = {
  photorealistic:
    "Photorealistic 8K UHD architectural photography, Hasselblad H6D-100c medium format, crystal clear focus, high dynamic range, natural material textures, ArchDaily quality",
  archdaily:
    "ArchDaily & Dezeen editorial showcase photography, clean architectural lines, precise orthogonal perspective, true-to-life materials, subtle realistic ambient occlusion",
  biophilic:
    "Biophilic contemporary architecture, living green wall facades, sustainable timber accents, integrated water features, dappled sunbeams, rich indoor-outdoor connection",
  japandi:
    "Japandi warm minimalist aesthetics, wabi-sabi imperfect textures, microcement walls, natural light oak battens, low-profile clean furniture, serene zen atmosphere",
  brutalist:
    "Contemporary sculptural Brutalism, exposed board-marked raw concrete, dramatic geometric cantilevers, deep recessed window reveals, matte black steel accents",
  tropical_modern:
    "Tropical modern residential architecture, terracotta jali perforated screens, exposed red clay brickwork, central open courtyard, shaded verandahs, lush frangipani landscaping",
  luxury_penthouse:
    "Ultra-luxury modern penthouse design, bookmatched Calacatta marble, brushed brass joinery, floor-to-ceiling Low-E curtain wall glass, warm architectural cove lighting",
  golden_hour:
    "Golden hour sunset illumination, warm 3200K golden sunlight rays, long cinematic shadows, crystal clear focus, glowing architectural facade",
  moody_night:
    "Cinematic blue hour night photography, 2700K warm interior illumination glowing through glass, exterior pathway up-lights, architectural spot illumination, deep twilight sky",
  minimal_clean:
    "Minimalist Scandinavian design, neutral monochromatic palette, ultra-clean sharp lines, soft diffused daylight, uncluttered spatial elegance",
  sketch_render:
    "Architectural visualization hybrid, crisp hand-drawn technical ink lines blended with realistic digital watercolor render, high artistic clarity",
};

export const LIGHTING_PRESETS: Record<string, string> = {
  natural_daylight:
    "Crisp 5500K natural daylight, balanced sun exposure, soft realistic building shadows, global illumination",
  golden_hour:
    "Warm 3200K golden hour sunlight, low sun angle with dramatic long shadows, warm ambient bounce light, glowing glass reflections",
  blue_hour:
    "Deep cobalt blue hour twilight sky, contrast with glowing 2700K warm interior lights and exterior landscape spotlights",
  dramatic_night:
    "Midnight architectural illumination, dramatic recessed downlights, illuminated landscaping, pool water reflections, dark starlit sky",
  soft_overcast:
    "Soft diffused overcast studio daylight, minimal harsh shadows, high color fidelity, even ambient illumination on all facade materials",
  foggy_morning:
    "Misty atmospheric morning haze, soft volumetric light rays breaking through foliage, ethereal architectural presence",
};

export const CAMERA_PRESETS: Record<string, string> = {
  eye_level:
    "Eye-level 35mm human perspective, 5.5ft camera height, natural focal length, realistic street-view composition",
  tilt_shift_wide:
    "24mm architectural tilt-shift lens, corrected vertical perspective with zero keystoning, parallel vertical columns, wide landscape framing",
  isometric_axonometric:
    "3D axonometric isometric view, conceptual architectural model style, 45-degree elevated angle, clean structural clarity",
  aerial_drone:
    "High-angle aerial drone photography, site plan perspective showing roof architecture, surrounding landscaping, and property boundary integration",
  interior_wide:
    "18mm interior architectural wide-angle perspective, balanced three-wall room composition, straight floor lines, natural eye height",
  macro_detail:
    "Macro close-up architectural vignette, focus on material joinery, stone texture, timber grain, and craftsmanship details, shallow depth of field",
};

export const ASPECT_RATIOS: Record<
  string,
  {
    label: string;
    modifier: string;
    width: number;
    height: number;
    ratioStr: "1:1" | "16:9" | "4:3" | "9:16" | "3:2";
  }
> = {
  "1:1": {
    label: "1:1 Square",
    modifier: "Square 1:1 ratio, balanced central composition",
    width: 1440,
    height: 1440,
    ratioStr: "1:1",
  },
  "16:9": {
    label: "16:9 Cinema",
    modifier: "Widescreen 16:9 cinematic horizontal frame, panoramic architectural vista",
    width: 1920,
    height: 1080,
    ratioStr: "16:9",
  },
  "4:3": {
    label: "4:3 Classic",
    modifier: "Classic 4:3 architectural photo ratio, balanced horizontal depth",
    width: 1440,
    height: 1080,
    ratioStr: "4:3",
  },
  "9:16": {
    label: "9:16 Story",
    modifier: "Vertical 9:16 portrait frame, full vertical facade and elevation perspective",
    width: 1080,
    height: 1920,
    ratioStr: "9:16",
  },
  "3:2": {
    label: "3:2 Photo",
    modifier: "Classic 3:2 full-frame SLR camera perspective, cinematic golden ratio framing",
    width: 1620,
    height: 1080,
    ratioStr: "3:2",
  },
};

export const ARCHITECTURAL_NEGATIVE_GUARDRAILS =
  "no distorted perspective, no warped walls, no curved columns, no melting furniture, no floating artifacts, no cartoon illustration, no CGI plastic look, no oversaturated colors, no lens flare artifact, no watermark, no text signatures, no blurry background, no people";

export function buildImagePrompt(
  tool: "architecture" | "interior" | "redesign",
  brief: string,
  settings: Record<string, string | number>,
  stylePreset: string = "photorealistic",
  aspectRatio: string = "1:1",
  lightingMood: string = "natural_daylight",
  cameraAngle: string = "eye_level",
) {
  const details = Object.entries(settings)
    .filter(
      ([k, v]) =>
        v !== "" &&
        v !== undefined &&
        v !== null &&
        k !== "style_preset" &&
        k !== "aspect_ratio" &&
        k !== "lighting_mood" &&
        k !== "camera_angle" &&
        k !== "seed",
    )
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
    .join("; ");

  const styleModifier = STYLE_PRESETS[stylePreset] || STYLE_PRESETS["photorealistic"];
  const lightingModifier = LIGHTING_PRESETS[lightingMood] || LIGHTING_PRESETS["natural_daylight"];
  const cameraModifier = CAMERA_PRESETS[cameraAngle] || CAMERA_PRESETS["eye_level"];
  const ratioModifier =
    ASPECT_RATIOS[aspectRatio]?.modifier ?? ASPECT_RATIOS["1:1"]?.modifier ?? "Square 1:1 ratio";
  const sharpnessMod =
    "ultra sharp 8K UHD resolution, raytraced global illumination, authentic material roughness and specular reflections, pristine architectural model quality";

  if (tool === "architecture") {
    return `Architectural exterior master photography. Project brief: ${brief || "modern luxury residential villa"}. Parameters: ${details || "standard specifications"}. Style: ${styleModifier}. Lighting & Environment: ${lightingModifier}. Camera Setup: ${cameraModifier}. Frame: ${ratioModifier}. Quality: ${sharpnessMod}. Visual elements: Complete building facade with structural realism, cantilevered slabs, landscaped greenery and pathway lighting, floor-to-ceiling glass reveals showing warm interior glow, architectural photography published in Architectural Digest. Negative filters: ${ARCHITECTURAL_NEGATIVE_GUARDRAILS}.`;
  }

  if (tool === "interior") {
    return `Interior design editorial photography. Room brief: ${brief || "contemporary luxury living space"}. Parameters: ${details || "standard specifications"}. Style: ${styleModifier}. Lighting: ${lightingModifier}. Camera: ${cameraModifier}. Frame: ${ratioModifier}. Quality: ${sharpnessMod}. Composition: Cohesive interior layout with curated designer furniture, plush seating, bespoke coffee table, accent floor lamps, tactile area rug, architectural wall panels, potted indoor plants, balanced decor accessories, crystal clear depth. Negative filters: ${ARCHITECTURAL_NEGATIVE_GUARDRAILS}.`;
  }

  return `Architectural room restyle and interior transformation. Maintain exact room boundaries, window positions, ceiling height, and doorway openings from the source image. Target brief: ${brief || "modern aesthetic makeover"}. Parameters: ${details || "standard specifications"}. Style: ${styleModifier}. Ambient Lighting: ${lightingModifier}. Camera Angle: ${cameraModifier}. Frame: ${ratioModifier}. Quality: ${sharpnessMod}. Upgrades: Replace outdated finishes with premium materials, contemporary designer furniture, modern lighting fixtures, cohesive color palette, pristine interior staging. Negative filters: ${ARCHITECTURAL_NEGATIVE_GUARDRAILS}.`;
}

export const PROMPT_ENHANCER_SYSTEM = `You are a world-class architectural visualization director and prompt engineer.
Your task is to transform brief or basic architectural requests into precise, highly descriptive, professional prompt briefs.
Incorporate:
1. Exact material finishes (e.g. fluted travertine stone, Shou Sugi Ban charred timber, board-formed concrete, low-iron curtain wall glass, brushed bronze hardware).
2. Volumetric lighting and natural environment (e.g. 3200K golden hour sunbeams, soft overcast diffuse illumination, ambient floor uplighting).
3. Structural and spatial authenticity (e.g. cantilevered roof planes, recessed glazing, floating staircases, courtyard integration).
4. Interior styling or landscaping harmony (e.g. fiddle leaf fig tree in terra-cotta planter, textured wool bouclé sofa, bespoke marble plinth table).

Output ONLY the expanded, high-fidelity prompt in 2 to 3 rich sentences. Do NOT include markdown fences, prefixes, or commentary.`;

export const FLOOR_PLAN_SYSTEM = `You are a master architectural space planner producing professional CONCEPTUAL residential floor plans.
Return ONLY valid JSON of the shape:
{
  "rooms": [
    {"id": "r1", "name": "Living & Dining", "type": "living", "x": 0, "y": 0, "w": 18, "h": 14},
    {"id": "r2", "name": "Kitchen", "type": "kitchen", "x": 18, "y": 0, "w": 12, "h": 10},
    {"id": "r3", "name": "Master Suite", "type": "master_bedroom", "x": 0, "y": 14, "w": 16, "h": 14}
  ]
}

Space Planning & Vastu Rules:
1. Valid types: "living", "master_bedroom", "bedroom", "kitchen", "dining", "bathroom", "balcony", "pooja", "foyer", "utility".
2. Units are feet on a rectangular grid starting at (0, 0).
3. Rooms must tightly tile the given plot dimensions without overlapping.
4. Apply Vastu zoning:
   - Master Bedroom in South-West (Nairutya).
   - Kitchen & Utility in South-East (Agneya).
   - Pooja / Meditation in North-East (Ishanya).
   - Living & Foyer in North or East.
   - Bathrooms in West / North-West.
5. Provide realistic room proportions and practical circulation. Total rooms between 4 and 10.
Never output markdown fences, prefixes, or commentary.`;

export function buildFloorPlan3DPrompt(
  rooms: Array<{ name: string; w: number; h: number; type?: string | undefined }>,
  bhk: number,
  plot: string,
  stylePreset: string = "photorealistic",
) {
  const roomSummary = rooms.map((r) => `${r.name} (${r.w}x${r.h} ft)`).join(", ");
  const styleModifier = STYLE_PRESETS[stylePreset] || STYLE_PRESETS["photorealistic"];

  return `High-end 3D architectural cutaway floor plan visualization of a ${bhk} BHK layout on a ${plot} plot. Isometric 3D floor plan perspective viewed from a 45-degree elevated angle, showing roof removed and full interior layout. Rooms included: ${roomSummary}. Fully furnished with realistic designer furniture (beds with plush linens, modern L-shaped living sofa, marble dining table, modular kitchen cabinets with polished quartz countertops, sanitary bathroom fixtures). Architectural features: finished hardwood and microcement flooring, exterior glass walls, realistic internal partition walls with door openings, soft interior lighting glow, natural sunlight casting soft shadows. ${styleModifier}. Pristine 3D architectural model render, Octane render, ArchDaily showcase quality, no people, no watermark.`;
}

export const ASSISTANT_SYSTEM = `You are ArchiGen's design co-pilot: an experienced architect and interior designer
familiar with Indian residential practice (BHK layouts, vastu, local materials, budgets in INR).
Give practical, specific answers in under 180 words, using short paragraphs or bullets.
Always remind the user, when giving dimensions or structural guidance, that suggestions are conceptual
and must be validated by a licensed architect or structural engineer before construction.`;
