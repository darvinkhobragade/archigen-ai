import type { PlanRoom } from "@/lib/types/generation";

export type FloorPlanLayout = {
  rooms: PlanRoom[];
};

/**
 * Intelligent architectural layout generator that parses user briefs (BHK, plot dimensions, Vastu requirements)
 * and generates structured 2D room layouts with dimension coordinates.
 */
export function generateSmartFloorPlan(userContent: string): FloorPlanLayout {
  const bhkMatch = userContent.match(/(\d+)\s*BHK/i);
  const bhk = bhkMatch && bhkMatch[1] ? parseInt(bhkMatch[1], 10) : 2;

  const hasPooja = /pooja|mandir|prayer/i.test(userContent);
  const hasBalcony = /balcony|terrace|sitout/i.test(userContent);

  // Parse plot dimensions if mentioned e.g. "30 x 40", "30x50", "40 x 60"
  const plotMatch = userContent.match(/(\d+)\s*[xX*×]\s*(\d+)/);
  const plotW =
    plotMatch && plotMatch[1] ? Math.max(20, Math.min(60, parseInt(plotMatch[1], 10))) : 30;
  const plotH =
    plotMatch && plotMatch[2] ? Math.max(20, Math.min(60, parseInt(plotMatch[2], 10))) : 40;

  const rooms: PlanRoom[] = [];

  if (bhk === 1) {
    // 1 BHK Layout - ~24x26 ft space plan
    const midX = Math.round(plotW * 0.55);
    const midY = Math.round(plotH * 0.55);
    rooms.push(
      { id: "r1", name: "Living Room", type: "living", x: 0, y: 0, w: midX, h: midY },
      {
        id: "r2",
        name: "Master Bedroom",
        type: "master_bedroom",
        x: midX,
        y: 0,
        w: plotW - midX,
        h: midY,
      },
      {
        id: "r3",
        name: "Modular Kitchen",
        type: "kitchen",
        x: 0,
        y: midY,
        w: Math.round(midX * 0.7),
        h: plotH - midY,
      },
      {
        id: "r4",
        name: "Bathroom",
        type: "bathroom",
        x: Math.round(midX * 0.7),
        y: midY,
        w: midX - Math.round(midX * 0.7),
        h: plotH - midY,
      },
      {
        id: "r5",
        name: "Sitout Balcony",
        type: "balcony",
        x: midX,
        y: midY,
        w: plotW - midX,
        h: plotH - midY,
      },
    );
  } else if (bhk === 3) {
    // 3 BHK Vastu Layout - ~30x45 ft space plan
    const col1W = Math.round(plotW * 0.38);
    const col2W = Math.round(plotW * 0.34);
    const col3W = plotW - col1W - col2W;

    const row1H = Math.round(plotH * 0.38);
    const row2H = Math.round(plotH * 0.34);
    const row3H = plotH - row1H - row2H;

    rooms.push(
      // North / North-East: Grand Living & Foyer
      { id: "r1", name: "Living & Foyer", type: "living", x: 0, y: 0, w: col1W + col2W, h: row1H },
      // North-East / East: Dining & Pooja
      {
        id: "r2",
        name: hasPooja ? "Dining & Pooja" : "Dining Room",
        type: hasPooja ? "pooja" : "dining",
        x: col1W + col2W,
        y: 0,
        w: col3W,
        h: row1H,
      },
      // South-East (Agneya): Modular Kitchen & Utility
      {
        id: "r3",
        name: "Modular Kitchen",
        type: "kitchen",
        x: col1W + col2W,
        y: row1H,
        w: col3W,
        h: row2H,
      },
      {
        id: "r4",
        name: "Kitchen Utility",
        type: "utility",
        x: col1W + col2W,
        y: row1H + row2H,
        w: col3W,
        h: row3H,
      },
      // South-West (Nairutya): Master Suite
      {
        id: "r5",
        name: "Master Suite",
        type: "master_bedroom",
        x: 0,
        y: row1H,
        w: col1W,
        h: row2H + row3H,
      },
      // West: Master Attached Bath
      {
        id: "r6",
        name: "Master Bath",
        type: "bathroom",
        x: col1W,
        y: row1H,
        w: col2W,
        h: Math.round(row2H * 0.5),
      },
      // North-West: Bedroom 2
      {
        id: "r7",
        name: "Bedroom 2",
        type: "bedroom",
        x: col1W,
        y: row1H + Math.round(row2H * 0.5),
        w: col2W,
        h: row2H - Math.round(row2H * 0.5),
      },
      // South: Bedroom 3
      {
        id: "r8",
        name: "Bedroom 3 (Kids)",
        type: "bedroom",
        x: col1W,
        y: row1H + row2H,
        w: Math.round(col2W * 0.65),
        h: row3H,
      },
      // Common Bathroom
      {
        id: "r9",
        name: "Common Bath",
        type: "bathroom",
        x: col1W + Math.round(col2W * 0.65),
        y: row1H + row2H,
        w: col2W - Math.round(col2W * 0.65),
        h: row3H,
      },
    );
  } else if (bhk >= 4) {
    // 4 BHK Luxury Layout
    const col1W = Math.round(plotW * 0.35);
    const col2W = Math.round(plotW * 0.35);
    const col3W = plotW - col1W - col2W;

    const row1H = Math.round(plotH * 0.35);
    const row2H = Math.round(plotH * 0.35);
    const row3H = plotH - row1H - row2H;

    rooms.push(
      { id: "r1", name: "Formal Living", type: "living", x: 0, y: 0, w: col1W + col2W, h: row1H },
      { id: "r2", name: "Dining Hall", type: "dining", x: col1W + col2W, y: 0, w: col3W, h: row1H },
      {
        id: "r3",
        name: "Chef Kitchen",
        type: "kitchen",
        x: col1W + col2W,
        y: row1H,
        w: col3W,
        h: row2H,
      },
      {
        id: "r4",
        name: "Utility & Store",
        type: "utility",
        x: col1W + col2W,
        y: row1H + row2H,
        w: col3W,
        h: row3H,
      },
      {
        id: "r5",
        name: "Master Suite",
        type: "master_bedroom",
        x: 0,
        y: row1H,
        w: col1W,
        h: row2H,
      },
      {
        id: "r6",
        name: "Master Bath",
        type: "bathroom",
        x: col1W,
        y: row1H,
        w: col2W,
        h: Math.round(row2H * 0.5),
      },
      {
        id: "r7",
        name: "Bedroom 2 (Guest)",
        type: "bedroom",
        x: col1W,
        y: row1H + Math.round(row2H * 0.5),
        w: col2W,
        h: row2H - Math.round(row2H * 0.5),
      },
      { id: "r8", name: "Bedroom 3", type: "bedroom", x: 0, y: row1H + row2H, w: col1W, h: row3H },
      {
        id: "r9",
        name: "Bedroom 4 (Study)",
        type: "bedroom",
        x: col1W,
        y: row1H + row2H,
        w: Math.round(col2W * 0.65),
        h: row3H,
      },
      {
        id: "r10",
        name: "Common Bath",
        type: "bathroom",
        x: col1W + Math.round(col2W * 0.65),
        y: row1H + row2H,
        w: col2W - Math.round(col2W * 0.65),
        h: row3H,
      },
    );
  } else {
    // 2 BHK Vastu Space Plan (Standard 30x40 ft)
    const midX = Math.round(plotW * 0.52);
    const rightW = plotW - midX;
    const topH = Math.round(plotH * 0.45);
    const bottomH = plotH - topH;

    const bathW = Math.round(rightW * 0.45);
    const kitchenW = rightW - bathW;

    rooms.push(
      // North: Living & Dining
      { id: "r1", name: "Living & Dining", type: "living", x: 0, y: 0, w: midX, h: topH },
      // North-East / East: Modular Kitchen (SE Corner)
      { id: "r2", name: "Modular Kitchen", type: "kitchen", x: midX, y: 0, w: kitchenW, h: topH },
      // East: Attached Utility
      { id: "r3", name: "Utility", type: "utility", x: midX + kitchenW, y: 0, w: bathW, h: topH },
      // South-West: Master Bedroom
      {
        id: "r4",
        name: "Master Bedroom",
        type: "master_bedroom",
        x: 0,
        y: topH,
        w: Math.round(midX * 0.68),
        h: bottomH,
      },
      // West: Master Attached Bath
      {
        id: "r5",
        name: "Master Bath",
        type: "bathroom",
        x: Math.round(midX * 0.68),
        y: topH,
        w: midX - Math.round(midX * 0.68),
        h: Math.round(bottomH * 0.55),
      },
      // North-West: Common Bath
      {
        id: "r6",
        name: "Common Bath",
        type: "bathroom",
        x: Math.round(midX * 0.68),
        y: topH + Math.round(bottomH * 0.55),
        w: midX - Math.round(midX * 0.68),
        h: bottomH - Math.round(bottomH * 0.55),
      },
      // South-East: Bedroom 2
      {
        id: "r7",
        name: "Bedroom 2",
        type: "bedroom",
        x: midX,
        y: topH,
        w: rightW,
        h: hasBalcony ? Math.round(bottomH * 0.72) : bottomH,
      },
    );

    if (hasBalcony) {
      rooms.push({
        id: "r8",
        name: "Sitout Balcony",
        type: "balcony",
        x: midX,
        y: topH + Math.round(bottomH * 0.72),
        w: rightW,
        h: bottomH - Math.round(bottomH * 0.72),
      });
    }
  }

  return { rooms };
}

/** Legacy wrapper returning stringified JSON */
export function generateSmartFloorPlanJSON(userContent: string): string {
  return JSON.stringify(generateSmartFloorPlan(userContent));
}
