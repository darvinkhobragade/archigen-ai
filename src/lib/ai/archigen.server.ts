import { ASPECT_RATIOS, PROMPT_ENHANCER_SYSTEM } from "./prompts";
import { ARCHIGEN_WATERMARK_BASE64 } from "./watermark.data";

function getBaseUrl() {
  return process.env["AI_BASE_URL"] || "https://openrouter.ai/api/v1";
}

export const IMAGE_MODEL = process.env["AI_IMAGE_MODEL"] || "imagen-3.0-generate-002";
export const TEXT_MODEL = process.env["AI_TEXT_MODEL"] || "gemini-3.5-flash";

function getApiKey(): string | null {
  return (
    process.env["AI_API_KEY"] ||
    process.env["GEMINI_API_KEY"] ||
    process.env["OPENAI_API_KEY"] ||
    process.env["LOVABLE_API_KEY"] ||
    null
  );
}

function getGeminiKey(): string | null {
  return process.env["GEMINI_API_KEY"] || process.env["AI_API_KEY"] || null;
}

interface ImagenResponse {
  predictions?: Array<{
    bytesBase64Encoded?: string;
    mimeType?: string;
  }>;
}

interface GeminiContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface OpenRouterImageResponse {
  choices?: Array<{
    message?: {
      images?: Array<{
        image_url?: { url?: string };
      }>;
    };
  }>;
}

interface OpenRouterChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

/** Generate visualizer concept SVG image bytes when API key is missing or endpoint fails */
function createFallbackSvgBytes(
  prompt: string,
  tool: string = "architecture",
  watermark: boolean = true,
): { bytes: Uint8Array; contentType: string; seed: number } {
  const title = prompt.slice(0, 75) + (prompt.length > 75 ? "…" : "");
  const isInterior = tool === "interior";
  const isRedesign = tool === "redesign";
  const isFloorPlan = tool === "floor-plan";

  const primaryGradientStart = isInterior ? "#1e293b" : isRedesign ? "#0f172a" : isFloorPlan ? "#f8fafc" : "#0c1427";
  const primaryGradientEnd = isInterior ? "#334155" : isRedesign ? "#1e293b" : isFloorPlan ? "#f1f5f9" : "#1e293b";
  const accentColor = isInterior ? "#f59e0b" : isRedesign ? "#ec4899" : isFloorPlan ? "#ea580c" : "#3b82f6";
  const glassGlow = isInterior ? "#fef3c7" : "#bfdbfe";

  const svg = isFloorPlan
    ? `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1300" width="1000" height="1300">
    <defs>
      <pattern id="wood" width="40" height="20" patternUnits="userSpaceOnUse">
        <rect width="40" height="20" fill="#f7eee6"/>
        <line x1="0" y1="20" x2="40" y2="20" stroke="#e2d4c7" stroke-width="1"/>
      </pattern>
      <pattern id="marble" width="30" height="30" patternUnits="userSpaceOnUse">
        <rect width="30" height="30" fill="#faf6f0"/>
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e7e0d6" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="1000" height="1300" fill="#ffffff"/>
    <text x="500" y="60" text-anchor="middle" fill="#c2410c" font-family="sans-serif" font-size="28" font-weight="900" letter-spacing="2">ARCHITECTURAL PRESENTATION FLOOR PLAN</text>
    <rect x="80" y="90" width="840" height="1100" fill="none" stroke="#0f172a" stroke-width="8"/>
    <!-- Living & Dining -->
    <rect x="80" y="90" width="480" height="420" fill="url(#marble)" stroke="#1e293b" stroke-width="6"/>
    <text x="320" y="300" text-anchor="middle" fill="#0f172a" font-family="sans-serif" font-size="22" font-weight="bold">LIVING &amp; DINING</text>
    <!-- Kitchen -->
    <rect x="560" y="90" width="360" height="300" fill="#f1f5f9" stroke="#1e293b" stroke-width="6"/>
    <text x="740" y="240" text-anchor="middle" fill="#0f172a" font-family="sans-serif" font-size="20" font-weight="bold">KITCHEN</text>
    <!-- Master Bedroom -->
    <rect x="80" y="510" width="440" height="380" fill="url(#wood)" stroke="#1e293b" stroke-width="6"/>
    <text x="300" y="700" text-anchor="middle" fill="#0f172a" font-family="sans-serif" font-size="20" font-weight="bold">MASTER BEDROOM</text>
    <!-- Bedroom 2 -->
    <rect x="520" y="390" width="400" height="400" fill="url(#wood)" stroke="#1e293b" stroke-width="6"/>
    <text x="720" y="590" text-anchor="middle" fill="#0f172a" font-family="sans-serif" font-size="20" font-weight="bold">BEDROOM 2</text>
    <!-- Parking & Sitout -->
    <rect x="520" y="790" width="400" height="400" fill="#e2e8f0" stroke="#1e293b" stroke-width="6"/>
    <text x="720" y="990" text-anchor="middle" fill="#0f172a" font-family="sans-serif" font-size="20" font-weight="bold">PARKING &amp; CAR</text>
    <!-- Sitout -->
    <rect x="80" y="890" width="440" height="300" fill="#cbd5e1" stroke="#1e293b" stroke-width="6"/>
    <text x="300" y="1040" text-anchor="middle" fill="#0f172a" font-family="sans-serif" font-size="20" font-weight="bold">SIT OUT &amp; FOYER</text>
    <!-- Title Banner -->
    <rect x="60" y="1210" width="880" height="50" rx="8" fill="#0f172a" opacity="0.9"/>
    <text x="500" y="1242" text-anchor="middle" fill="#f8fafc" font-family="sans-serif" font-size="16">${title}</text>
  </svg>`
    : `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryGradientStart}"/>
        <stop offset="100%" stop-color="${primaryGradientEnd}"/>
      </linearGradient>
      <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${glassGlow}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.1"/>
      </linearGradient>
      <linearGradient id="wood" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#b45309"/>
        <stop offset="50%" stop-color="#d97706"/>
        <stop offset="100%" stop-color="#92400e"/>
      </linearGradient>
      <linearGradient id="sun" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#f97316" stop-opacity="0"/>
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>
      </pattern>
    </defs>

    <!-- Background -->
    <rect width="1200" height="900" fill="url(#bg)"/>
    <rect width="1200" height="900" fill="url(#grid)"/>

    <!-- Sun Glow -->
    <circle cx="1000" cy="180" r="320" fill="url(#sun)"/>

    ${
      isInterior
        ? `
    <!-- Interior Furniture & Wall geometry -->
    <polygon points="150,150 1050,150 1050,650 150,650" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <polygon points="150,650 1050,650 1200,900 0,900" fill="#0f172a"/>
    <rect x="200" y="200" width="220" height="420" fill="url(#wood)" rx="4"/>
    <rect x="480" y="480" width="440" height="140" fill="#3b82f6" rx="16" opacity="0.9"/>
    <rect x="460" y="520" width="480" height="70" fill="#1d4ed8" rx="12"/>
    <ellipse cx="700" cy="680" rx="160" ry="40" fill="#475569" stroke="#94a3b8" stroke-width="2"/>
    <line x1="250" y1="650" x2="250" y2="350" stroke="#f59e0b" stroke-width="4"/>
    <circle cx="250" cy="350" r="30" fill="#fef08a" filter="drop-shadow(0 0 20px #f59e0b)"/>
    `
        : `
    <!-- Architecture Facade / Exterior Geometry -->
    <rect x="0" y="680" width="1200" height="220" fill="#064e3b" opacity="0.7"/>
    <rect x="280" y="220" width="560" height="460" fill="#1e293b" stroke="#475569" stroke-width="3" rx="8"/>
    <rect x="200" y="160" width="520" height="240" fill="#0f172a" stroke="${accentColor}" stroke-width="2" rx="6"/>
    <rect x="240" y="190" width="220" height="180" fill="url(#glass)" stroke="#93c5fd" stroke-width="2" rx="4"/>
    <rect x="490" y="190" width="200" height="180" fill="url(#glass)" stroke="#93c5fd" stroke-width="2" rx="4"/>
    <rect x="580" y="440" width="220" height="240" fill="url(#wood)" rx="4"/>
    <rect x="360" y="480" width="110" height="200" fill="#0f172a" stroke="#cbd5e1" stroke-width="2"/>
    <polygon points="120,740 1080,740 1000,880 200,880" fill="#0284c7" opacity="0.35"/>
    `
    }

    ${
      watermark
        ? `
    <!-- Watermark / HUD Badge -->
    <rect x="40" y="40" width="380" height="64" rx="8" fill="#0f172a" opacity="0.85" stroke="#334155" stroke-width="1.5"/>
    <text x="60" y="70" fill="#f8fafc" font-family="sans-serif" font-size="18" font-weight="600">ArchiGen AI Concept Render</text>
    <text x="60" y="92" fill="${accentColor}" font-family="sans-serif" font-size="12" font-weight="500">${tool.toUpperCase()} MODE</text>
    `
        : ""
    }

    <!-- Prompt Caption Footer -->
    <rect x="40" y="810" width="1120" height="50" rx="8" fill="#0f172a" opacity="0.9" stroke="#334155" stroke-width="1"/>
    <text x="60" y="842" fill="#cbd5e1" font-family="sans-serif" font-size="14">${title}</text>
  </svg>
  `;

  return {
    bytes: new TextEncoder().encode(svg),
    contentType: "image/svg+xml",
    seed: 42,
  };
}

/** Overlays the custom ArchiGen AI badge on the bottom-right corner to cleanly cover any third-party watermark */
export async function applyArchiGenWatermark(
  imageBytes: Uint8Array,
  contentType: string = "image/jpeg",
): Promise<Uint8Array> {
  try {
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default || sharpModule;

    const watermarkBuffer = Buffer.from(ARCHIGEN_WATERMARK_BASE64, "base64");
    const imgMeta = await sharp(imageBytes).metadata();
    if (!imgMeta.width || !imgMeta.height) return imageBytes;

    // Scale badge proportionally (covers the bottom-right corner where pollinations places its logo)
    const badgeWidth = Math.max(220, Math.min(320, Math.round(imgMeta.width * 0.25)));

    const badgeRaw = await sharp(watermarkBuffer)
      .resize({ width: badgeWidth })
      .toBuffer();

    const badgeMeta = await sharp(badgeRaw).metadata();
    if (!badgeMeta.width || !badgeMeta.height) return imageBytes;

    const radius = Math.round(badgeMeta.height * 0.22);
    const mask = Buffer.from(
      `<svg width="${badgeMeta.width}" height="${badgeMeta.height}">` +
      `<rect x="0" y="0" width="${badgeMeta.width}" height="${badgeMeta.height}" rx="${radius}" ry="${radius}" fill="#fff"/>` +
      `</svg>`
    );

    const roundedBadge = await sharp(badgeRaw)
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();

    // Position at bottom right (8px margin) to cover the pollinations logo completely
    const margin = 8;
    const left = imgMeta.width - badgeMeta.width - margin;
    const top = imgMeta.height - badgeMeta.height - margin;

    const badgedImg = await sharp(imageBytes)
      .composite([{ input: roundedBadge, top, left }])
      .jpeg({ quality: 95 })
      .toBuffer();

    return new Uint8Array(badgedImg);
  } catch (err) {
    console.warn("[ArchiGen AI] Watermark overlay fallback:", err);
    return imageBytes;
  }
}

/** Generates photorealistic architectural render using Pollinations Flux engine with precision dimensions and seed */
async function fetchPhotorealisticFluxImage(
  prompt: string,
  aspectRatio: string = "1:1",
  seed?: number,
  isHires: boolean = false,
): Promise<{ bytes: Uint8Array; contentType: string; seed: number }> {
  const chosenSeed =
    seed !== undefined && !isNaN(seed) ? seed : Math.floor(Math.random() * 1000000);
  const ratioConfig = ASPECT_RATIOS[aspectRatio] ??
    ASPECT_RATIOS["1:1"] ?? { width: 1440, height: 1440 };

  // Scale resolution for high-resolution 8K output
  const width = isHires ? Math.min(2048, Math.round(ratioConfig.width * 1.35)) : ratioConfig.width;
  const height = isHires ? Math.min(2048, Math.round(ratioConfig.height * 1.35)) : ratioConfig.height;

  const finalPrompt = isHires
    ? `${prompt}, ultra-high resolution masterwork, 8k uhd photorealism, authentic material textures, raw uncompressed render`
    : prompt;

  const encodedPrompt = encodeURIComponent(finalPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${chosenSeed}&model=flux&enhance=true`;

  console.info(
    `[ArchiGen AI] Calling Flux rendering engine (${width}x${height}, hires: ${isHires}, seed ${chosenSeed}): ${imageUrl}`,
  );

  const res = await fetch(imageUrl, {
    headers: {
      "User-Agent": "ArchiGen-Studio/2.0",
    },
  });

  if (res.ok) {
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const watermarkedBytes = await applyArchiGenWatermark(new Uint8Array(buffer), contentType);
    return { bytes: watermarkedBytes, contentType, seed: chosenSeed };
  }

  throw new Error(`Flux generator responded with status ${res.status}`);
}

/** Native Google Gemini Image & Imagen 3 API integration */
async function fetchGoogleImagen3Image(
  prompt: string,
  aspectRatio: string = "1:1",
  apiKey: string,
): Promise<{ bytes: Uint8Array; contentType: string; seed: number } | null> {
  // 1. Try modern Gemini Image generation (gemini-2.5-flash-image)
  try {
    const flashEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;
    const res = await fetch(flashEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${prompt}, architectural photography render` }] }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const binary = atob(part.inlineData.data);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
          const contentType = part.inlineData.mimeType || "image/jpeg";
          console.info("[ArchiGen AI] Successfully generated concept with Gemini Flash Image.");
          return { bytes, contentType, seed: Math.floor(Math.random() * 1000000) };
        }
      }
    }
  } catch (err) {
    console.warn("[ArchiGen AI] Gemini Flash Image call failed:", err);
  }

  // 2. Fallback to Imagen 3 if supported
  try {
    const validRatios: Record<string, string> = {
      "1:1": "1:1",
      "16:9": "16:9",
      "4:3": "4:3",
      "9:16": "9:16",
      "3:2": "3:2",
    };
    const targetRatio = validRatios[aspectRatio] || "1:1";

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: targetRatio,
          outputOptions: { mimeType: "image/jpeg" },
          personGeneration: "DONT_ALLOW",
          safetySetting: "block_medium_and_above",
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(
        `[ArchiGen AI] Google Imagen 3 API returned ${res.status}: ${errText.slice(0, 200)}`,
      );
      return null;
    }

    const data = (await res.json()) as ImagenResponse;
    const b64 = data.predictions?.[0]?.bytesBase64Encoded;
    const mimeType = data.predictions?.[0]?.mimeType || "image/jpeg";

    if (b64) {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      console.info("[ArchiGen AI] Successfully generated concept with Google Imagen 3.");
      return { bytes, contentType: mimeType, seed: Math.floor(Math.random() * 1000000) };
    }
  } catch (err) {
    console.warn("[ArchiGen AI] Google Imagen 3 call failed:", err);
  }
  return null;
}

/** Analyze an uploaded room image with Gemini Vision to extract structural geometry */
export async function analyzeRoomGeometryVision(
  imageDataUrl: string,
  apiKey: string,
): Promise<string> {
  try {
    const base64Data = imageDataUrl.includes(",") ? imageDataUrl.split(",")[1] : imageDataUrl;
    const mimeType =
      imageDataUrl.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/)?.[1] || "image/jpeg";

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "You are an architectural vision analyzer. Extract the exact spatial geometry of this room in 1 concise sentence: 1) Camera vantage point & angle, 2) Positions of windows, doors and columns, 3) Ceiling height and floor plane boundaries. Do not mention existing furniture styling.",
              },
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
      }),
    });

    if (res.ok) {
      const json = (await res.json()) as GeminiContentResponse;
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        console.info(`[ArchiGen Vision] Extracted room geometry: ${text.trim()}`);
        return text.trim();
      }
    }
  } catch (err) {
    console.warn("[ArchiGen Vision] Vision analysis failed:", err);
  }
  return "maintain original room perimeter, window openings, camera vantage point and ceiling height";
}

/** Generates a single image and returns raw image bytes, content type & generation seed. */
export async function generateImageBytes(
  prompt: string,
  sourceImageDataUrl?: string,
  tool: string = "architecture",
  aspectRatio: string = "1:1",
  seed?: number,
  isHires: boolean = false,
  watermark: boolean = true,
): Promise<{ bytes: Uint8Array; contentType: string; seed: number }> {
  const geminiKey = getGeminiKey();
  let finalPrompt = prompt;

  // 1. If Room Redesign with source image and Gemini key, perform vision structure lock
  if (sourceImageDataUrl && geminiKey) {
    const geometryAnalysis = await analyzeRoomGeometryVision(sourceImageDataUrl, geminiKey);
    finalPrompt = `${prompt}. Structural spatial lock: ${geometryAnalysis}.`;
  }

  // 2. Try Google Imagen 3 if Gemini key is available
  if (geminiKey) {
    const imagenResult = await fetchGoogleImagen3Image(finalPrompt, aspectRatio, geminiKey);
    if (imagenResult) {
      return imagenResult;
    }
  }

  // 3. Try OpenRouter / Standard OpenAI if configured
  const standardKey = getApiKey();
  if (standardKey && !geminiKey) {
    try {
      const res = await fetch(`${getBaseUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${standardKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          messages: [{ role: "user", content: finalPrompt }],
        }),
      });

      if (res.ok) {
        const json = (await res.json()) as OpenRouterImageResponse;
        const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (url) {
          const imageRes = await fetch(url);
          if (imageRes.ok) {
            const contentType = imageRes.headers.get("content-type") || "image/png";
            return {
              bytes: new Uint8Array(await imageRes.arrayBuffer()),
              contentType,
              seed: seed || 42,
            };
          }
        }
      }
    } catch (err) {
      console.warn("[ArchiGen AI] OpenRouter image request failed:", err);
    }
  }

  // 4. Photorealistic Flux Engine (High Resolution & High Fidelity)
  try {
    return await fetchPhotorealisticFluxImage(finalPrompt, aspectRatio, seed, isHires);
  } catch (fluxErr) {
    console.warn("[ArchiGen AI] Flux generator failed, using vector concept fallback:", fluxErr);
  }

  // 5. Safe Vector Blueprint Fallback
  return createFallbackSvgBytes(prompt, tool, watermark);
}

/** Local high-end architectural prompt enhancer that expands briefs with material, lighting, and spatial realism */
export function enhanceArchitecturalPromptLocally(brief: string, tool: string): string {
  const cleanBrief = brief.trim();
  const isInterior = tool === "interior";
  const isRedesign = tool === "redesign";

  const hasBrick = /brick/i.test(cleanBrief);
  const hasConcrete = /concrete/i.test(cleanBrief);
  const hasWood = /wood|teak|timber|oak/i.test(cleanBrief);
  const hasCourtyard = /courtyard|garden|landscape|lawn/i.test(cleanBrief);
  const hasClassical = /classic|traditional|heritage|indian/i.test(cleanBrief);

  if (isInterior) {
    const materials = hasWood
      ? "natural white oak fluted wall battens, brushed brass joinery accents, and honed travertine stone finishes"
      : "fluted Italian travertine panels, microcement seamless flooring, and warm walnut custom cabinetry";
    const lighting =
      "layered 2700K warm architectural cove lighting, recessed ceiling spotlights, and soft natural diffused daylight from sheer drapery";
    const furniture =
      "bespoke low-profile sofa in textured wool bouclé, monolithic marble coffee table, minimalist wall clock on feature wall, and curated fiddle-leaf fig botanical planter";

    return `${cleanBrief}. Luxurious architectural interior featuring ${materials}. Illuminated by ${lighting}, furnished with ${furniture}. Shot on Hasselblad H6D-100c medium format, balanced 18mm interior perspective, published in Architectural Digest.`;
  }

  if (isRedesign) {
    const styling = hasClassical
      ? "warm Indian contemporary aesthetic with brass accents, teakwood furnishings, and refined handloom fabrics"
      : "serene Japandi warm minimal makeover with microcement finishes, light oak millwork, and organic tactile textures";

    return `${cleanBrief}. Complete interior transformation into a ${styling}, strictly preserving existing structural window openings, ceiling beams, and doorway alignments. Features warm 2700K ambient lighting, curated designer furniture, and magazine-quality architectural staging.`;
  }

  // Architecture (exterior)
  const facadeMaterials =
    hasBrick && hasConcrete
      ? "exposed handmade terracotta brickwork harmonized with board-formed architectural concrete and teak louvers"
      : hasConcrete
        ? "crisp board-marked raw concrete volumes, dark zinc facade cladding, and recessed floor-to-ceiling glass reveals"
        : hasBrick
          ? "perforated terracotta jali brick screens, warm teak pergolas, and textured lime plaster walls"
          : "cantilevered geometric volumes, fluted stone facade panels, and ultra-clear low-E curtain wall glazing";

  const landscaping = hasCourtyard
    ? "integrated internal courtyard with frangipani tree, water reflection basin, and warm recessed landscape uplighting"
    : "landscaped entrance with lush tropical greenery, illuminated basalt stone pavers, and manicured perimeter planters";

  const lighting =
    "bathed in 3200K golden hour sunlight casting dramatic architectural shadows with visible warm interior illumination through panoramic windows";

  return `${cleanBrief}. Masterfully detailed facade featuring ${facadeMaterials}, ${landscaping}, and ${lighting}. Photorealistic 8K UHD architectural photography, ArchDaily showcase quality, 24mm tilt-shift perspective.`;
}

/** Free Pollinations Text API integration for reliable AI completions */
async function fetchPollinationsText(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  jsonMode?: boolean,
): Promise<string | null> {
  try {
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        model: "openai",
        jsonMode: !!jsonMode,
        seed: Math.floor(Math.random() * 1000000),
      }),
    });

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    }
  } catch (err) {
    console.warn("[ArchiGen AI] Pollinations text API failed:", err);
  }
  return null;
}

/** High-level prompt enhancer that never returns generic chatbot strings */
export async function enhancePrompt(brief: string, tool: string): Promise<string> {
  const geminiKey = getGeminiKey();

  // 1. Try Gemini API if key is available
  if (geminiKey) {
    const text = await callGeminiGenerateContent(
      geminiKey,
      PROMPT_ENHANCER_SYSTEM,
      [{ role: "user", parts: [{ text: `Tool: ${tool}. Brief: ${brief}` }] }],
      { temperature: 0.7, timeoutMs: 15000 },
    );
    if (text && !text.includes("assistant co-pilot") && text.length > 20) {
      return text;
    }
  }

  // 2. Try Pollinations free AI text completion
  const pollinationsRes = await fetchPollinationsText([
    { role: "system", content: PROMPT_ENHANCER_SYSTEM },
    { role: "user", content: `Tool: ${tool}. Brief: ${brief}` },
  ]);

  if (
    pollinationsRes &&
    !pollinationsRes.includes("assistant co-pilot") &&
    pollinationsRes.length > 20
  ) {
    return pollinationsRes;
  }

  // 3. Guaranteed High-Quality Architectural Local Prompt Enhancer
  return enhanceArchitecturalPromptLocally(brief, tool);
}

function generateSmartFloorPlanJSON(userContent: string): string {
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

  type RoomItem = {
    id: string;
    name: string;
    type:
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
    x: number;
    y: number;
    w: number;
    h: number;
  };

  const rooms: RoomItem[] = [];

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

  return JSON.stringify({ rooms });
}

/**
 * Resilient multi-model Gemini generateContent caller with turn sanitization, timeout, and temperature tuning.
 */
async function callGeminiGenerateContent(
  apiKey: string,
  systemInstructionText: string | undefined,
  rawContents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
  options?: { json?: boolean; temperature?: number; candidateModels?: string[]; timeoutMs?: number },
): Promise<string | null> {
  const timeoutMs = options?.timeoutMs ?? 15000;
  const preferredModel = options?.candidateModels?.[0] || TEXT_MODEL;
  const modelsToTry = Array.from(
    new Set([
      preferredModel,
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-flash-lite-latest",
      "gemini-3.1-flash-lite",
    ]),
  );

  // 1. Sanitize conversation turns for Gemini v1beta:
  // Must start with user, and adjacent turns with the same role should be coalesced
  const sanitized: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  for (const turn of rawContents) {
    if (!turn.parts || turn.parts.length === 0 || !turn.parts[0]?.text?.trim()) continue;
    if (sanitized.length === 0 && turn.role !== "user") {
      // Skip leading model message
      continue;
    }
    const last = sanitized[sanitized.length - 1];
    if (last && last.role === turn.role) {
      last.parts[0]!.text += `\n\n${turn.parts[0]!.text}`;
    } else {
      sanitized.push({
        role: turn.role,
        parts: [{ text: turn.parts[0]!.text }],
      });
    }
  }

  if (sanitized.length === 0) {
    sanitized.push({ role: "user", parts: [{ text: "Hello" }] });
  }

  for (const model of modelsToTry) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(systemInstructionText
            ? { systemInstruction: { parts: [{ text: systemInstructionText }] } }
            : {}),
          contents: sanitized,
          generationConfig: {
            responseMimeType: options?.json ? "application/json" : "text/plain",
            temperature: options?.temperature ?? (options?.json ? 0.2 : 0.3),
            maxOutputTokens: 2500,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (res.ok) {
        const json = (await res.json()) as GeminiContentResponse;
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          return text.trim();
        }
      } else {
        const errText = await res.text();
        console.warn(
          `[ArchiGen AI] Gemini API model ${model} returned ${res.status}: ${errText.slice(0, 150)}`,
        );
      }
    } catch (err) {
      console.warn(`[ArchiGen AI] Gemini API model ${model} failed:`, err);
    }
  }

  return null;
}

/** Rich, domain-specific fallback for assistant queries when external APIs are unreachable */
function generateArchitecturalAssistantFallback(userQuery: string): string {
  const query = userQuery.toLowerCase();

  // 1. Plot layout question (e.g. 30x40, 30x50, 40x60, 20x30)
  const plotMatch = userQuery.match(/(\d+)\s*[xX*×]\s*(\d+)/);
  if (plotMatch && plotMatch[1] && plotMatch[2]) {
    const w = parseInt(plotMatch[1], 10);
    const d = parseInt(plotMatch[2], 10);
    const totalArea = w * d;
    const isNorth = /north/i.test(query);
    const isEast = /east/i.test(query);
    const facing = isNorth ? "North" : isEast ? "East" : "Standard";

    return `### **Architectural Layout Plan (${w}' × ${d}' | ${totalArea} sq ft - ${facing} Facing)**

**1. Setbacks & Built-Up Footprint:**
- **Front Setback:** 5'0" (driveway & entrance porch).
- **Rear Setback:** 3'0" (utility & cross-ventilation corridor).
- **Side Setbacks:** 2'6" to 3'0" light offsets.
- **Estimated Ground Built-up Footprint:** ~${Math.round(totalArea * 0.76)} sq ft.

**2. Spatial Allocation & Vastu Zoning:**
- **Living & Foyer:** ${Math.round(w * 0.5)}'0" × 16'0" (North / North-East) — bright welcoming lounge.
- **Master Bedroom Suite:** 12'0" × 14'0" (South-West / Nairutya) with 5'0" × 7'6" attached bath.
- **Secondary Bedroom:** 11'0" × 12'0" (North-West / Vayavya) with direct natural window light.
- **Modular Kitchen & Dining:** 10'0" × 12'0" (South-East / Agneya) with cooking platform facing East.
- **Pooja Mandir:** 4'0" × 5'0" (North-East / Ishanya).
- **Car Portico:** 10'0" × 15'0" covered parking bay.

**3. Material & Interior Finishes:**
- **Flooring:** 800×1600mm honed ivory vitrified tiles in public areas; matte wood-grain planks in bedrooms.
- **Kitchen Counter:** 20mm jet black granite or Calacatta quartz with marine-grade acrylic cabinetry.

**ArchiGen Generator Prompt:**
\`Photorealistic modern ${facing}-facing residential layout, ${w}x${d} plot, open-concept living and dining, Vastu-compliant kitchen in South-East, master suite in South-West, covered car parking, warm 3000K cove lighting.\`

*Conceptual design recommendation — verify on-site with a licensed structural engineer and municipal building bye-laws before construction.*`;
  }

  // 2. Palette and budget queries
  if (/palette|material|budget|lakh|cost|minimal|japandi/i.test(query)) {
    return `### **Material & Budget Specification Guide**

**1. Curated Material Palette:**
- **Flooring:** Light beige glazed vitrified tiles (600×1200mm) — ₹85–₹110/sq ft.
- **Walls & Ceilings:** Low-VOC matte warm white with fluted natural light oak wood veneer panels.
- **Joinery & Millwork:** High-density moisture-resistant (HDMR) board with anti-fingerprint acrylic or matte laminate.
- **Architectural Lighting:** Layered 3000K warm cove lights with CRI > 90 and trimless anti-glare ceiling downlights.

**2. Budget Allocation Guide (under ₹4–5 Lakh for 2BHK Interior Core):**
- **Modular Kitchen (BWP Marine Ply + Acrylic):** ₹1,60,000 – ₹1,90,000.
- **Master Bedroom Wardrobe (8' × 7' Sliding HDMR):** ₹90,000 – ₹1,10,000.
- **Living Room TV Console & Feature Wall:** ₹45,000 – ₹60,000.
- **False Ceiling & Cove Lighting (Hall & Dining):** ₹40,000 – ₹55,000.
- **Hardware & Soft Closures (Hettich/Hafele):** Included in joinery provisions.

**ArchiGen Generator Prompt:**
\`Japandi warm minimalist residential interior, natural light oak millwork, microcement walls, honed travertine coffee table, 3000K warm architectural cove lighting, serene ambiance.\`

*Conceptual design recommendation — verify actual vendor quotations and structural finishes locally.*`;
  }

  // 3. Dimensional clearances & corridors
  if (/corridor|hallway|passage|stair|clearance|width|height|dimension/i.test(query)) {
    return `### **Standard Architectural Dimensional Clearances**

- **Main Residential Corridors:** Minimum **3'6" (1050 mm)**; recommended **4'0" (1200 mm)** for two persons passing comfortably and furniture transit.
- **Internal Service Passages:** Minimum **3'0" (900 mm)**.
- **Internal Staircases:** Minimum flight width **3'3" (1000 mm)**; Riser height **6" (150 mm)**; Tread depth **10" to 11" (250–280 mm)**; Headroom clearance min **7'0" (2100 mm)**.
- **Clear Ceiling Height:** Minimum **9'6" (2900 mm)**; Standard residential **10'0" (3050 mm)**; High-ceiling luxury **11'0" to 12'0"**.
- **Door Openings:** Main entrance min **3'6" × 7'0"**; Bedrooms **3'0" × 7'0"**; Bathrooms / Balconies **2'6" × 7'0"**.

*Conceptual architectural standards — adhere strictly to National Building Code (NBC) and local municipal development control regulations.*`;
  }

  // 4. General architectural fallback
  return `### **ArchiGen Architectural Consultation**

As your Senior Architectural Co-Pilot, I can provide precision calculations and layouts for:

1. **Plot Space Planning & Floor Plans:** Setbacks, coverage, circulation, room sizing, and Vastu zoning for any plot dimensions (e.g. 20×30, 30×40, 30×50, 40×60).
2. **Vastu Shastra Principles:** Detailed cardinal orientation for master suites (SW), kitchens (SE), pooja rooms (NE), and entrances.
3. **Construction & Interior Costing:** Realistic civil (₹1,800–₹2,600/sq ft) and interior fit-out budgets in INR.
4. **Material Specifications:** Stone, tiles, timber, glass, fenestration, and thermal/acoustic considerations.

*Share your specific plot dimensions, budget range, or design requirements to receive a customized room-by-room architectural brief.*`;
}

/** Plain chat completion returning text via Gemini API, OpenRouter, or Pollinations. */
export async function chatCompletion(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  options?: { json?: boolean },
) {
  const geminiKey = getGeminiKey();
  const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";

  // 1. If Gemini key is available, use Google Gemini REST API with resilient fallback
  if (geminiKey) {
    const systemInstruction = messages.find((m) => m.role === "system")?.content;
    const conversation = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
        parts: [{ text: m.content }],
      }));

    const geminiText = await callGeminiGenerateContent(
      geminiKey,
      systemInstruction,
      conversation.length > 0
        ? conversation
        : [{ role: "user", parts: [{ text: lastUserMessage || "Hello" }] }],
      {
        json: options?.json,
        temperature: options?.json ? 0.2 : 0.3,
        timeoutMs: 18000,
      },
    );

    if (geminiText) {
      return geminiText;
    }
  }

  // 2. Try OpenRouter / Standard OpenAI
  const standardKey = getApiKey();
  if (standardKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 18000);
      const res = await fetch(`${getBaseUrl()}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${standardKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: TEXT_MODEL,
          messages,
          temperature: options?.json ? 0.2 : 0.3,
          ...(options?.json ? { response_format: { type: "json_object" } } : {}),
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = (await res.json()) as OpenRouterChatResponse;
        const content = json.choices?.[0]?.message?.content;
        if (content) return content as string;
      }
    } catch (err) {
      console.warn("[ArchiGen AI] OpenRouter chat completion failed:", err);
    }
  }

  // 3. Try Pollinations Text API (Free AI LLM)
  const polliText = await fetchPollinationsText(messages, options?.json);
  if (polliText) {
    return polliText;
  }

  // 4. Guaranteed domain-expert fallback
  if (options?.json) {
    return generateSmartFloorPlanJSON(lastUserMessage);
  }
  return generateArchitecturalAssistantFallback(lastUserMessage);
}

