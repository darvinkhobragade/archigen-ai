import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GenerateInput = {
  tool: "architecture" | "interior" | "redesign";
  prompt: string;
  settings: Record<string, string | number>;
  cost: number;
  stylePreset?: string | undefined;
  aspectRatio?: string | undefined;
  lightingMood?: string | undefined;
  cameraAngle?: string | undefined;
  seed?: number | undefined;
  projectId?: string | null | undefined;
  sourceImage?: string | null | undefined;
};

export type GenerateResult = {
  id: string;
  imagePath: string;
  url: string;
  creditsLeft: number;
  seed: number;
};

export const generateDesign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: GenerateInput) => input)
  .handler(async ({ data, context }): Promise<GenerateResult> => {
    const { supabase, userId } = context;
    const { buildImagePrompt } = await import("@/lib/ai/prompts");
    const { generateImageBytes } = await import("@/lib/ai/archigen.server");
    const TOOL_COST = { architecture: 4, interior: 3, redesign: 3 } as const;
    const cost = TOOL_COST[data.tool] ?? 4;

    const { data: creditsLeft, error: spendError } = await supabase.rpc("spend_credits", {
      _cost: cost,
      _reason: `${data.tool} generation`,
    });
    if (spendError) throw new Error("Not enough credits. Top up on the Credits & Plans page.");

    const refund = async () => {
      await supabase.rpc("refund_credits", { _amount: cost, _reason: `${data.tool} refund` });
    };

    let result: { bytes: Uint8Array; contentType: string; seed: number };
    try {
      const prompt = buildImagePrompt(
        data.tool,
        data.prompt,
        data.settings,
        data.stylePreset,
        data.aspectRatio,
        data.lightingMood,
        data.cameraAngle,
      );

      result = await generateImageBytes(
        prompt,
        data.sourceImage ?? undefined,
        data.tool,
        data.aspectRatio ?? "1:1",
        data.seed,
      );
    } catch (err) {
      await refund();
      throw err;
    }

    const ext = result.contentType.includes("svg")
      ? "svg"
      : result.contentType.includes("png")
        ? "png"
        : "jpg";
    const imagePath = `${userId}/${data.tool}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("renders")
      .upload(imagePath, result.bytes, { contentType: result.contentType, upsert: false });
    if (uploadError) {
      await refund();
      throw new Error(uploadError.message);
    }

    const { data: row, error: insertError } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        project_id: data.projectId ?? null,
        tool: data.tool,
        prompt: data.prompt,
        settings: {
          ...data.settings,
          style_preset: data.stylePreset ?? "photorealistic",
          aspect_ratio: data.aspectRatio ?? "1:1",
          lighting_mood: data.lightingMood ?? "natural_daylight",
          camera_angle: data.cameraAngle ?? "eye_level",
          seed: result.seed,
        },
        image_path: imagePath,
        credits_spent: cost,
        status: "complete",
      })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);

    const { data: signed } = await supabase.storage
      .from("renders")
      .createSignedUrl(imagePath, 3600);

    return {
      id: row.id,
      imagePath,
      url: signed?.signedUrl ?? "",
      creditsLeft: creditsLeft ?? 0,
      seed: result.seed,
    };
  });

export const enhancePromptServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brief: string; tool: string }) => input)
  .handler(async ({ data }): Promise<{ enhanced: string }> => {
    const { enhancePrompt } = await import("@/lib/ai/archigen.server");

    try {
      const response = await enhancePrompt(data.brief, data.tool);
      return { enhanced: response.trim() || data.brief };
    } catch {
      const { enhanceArchitecturalPromptLocally } = await import("@/lib/ai/archigen.server");
      return {
        enhanced: enhanceArchitecturalPromptLocally(data.brief, data.tool),
      };
    }
  });

export const signRender = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { path: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("renders")
      .createSignedUrl(data.path, 3600);
    if (error) throw new Error(error.message);
    return { url: signed?.signedUrl ?? "" };
  });

export type PlanRoom = {
  id: string;
  name: string;
  type?:
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
    | undefined;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const generateFloorPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { brief: string; bhk: number; plot: string }) => input)
  .handler(async ({ data, context }): Promise<{ rooms: PlanRoom[]; creditsLeft: number }> => {
    const { supabase, userId } = context;
    const cost = 5;
    const { chatCompletion } = await import("@/lib/ai/archigen.server");
    const { FLOOR_PLAN_SYSTEM } = await import("@/lib/ai/prompts");

    const { data: creditsLeft, error: spendError } = await supabase.rpc("spend_credits", {
      _cost: cost,
      _reason: "floor-plan generation",
    });
    if (spendError) throw new Error("Not enough credits. Top up on the Credits & Plans page.");

    const refund = async () => {
      await supabase.rpc("refund_credits", { _amount: cost, _reason: "floor-plan refund" });
    };

    let raw: string;
    try {
      raw = await chatCompletion(
        [
          { role: "system", content: FLOOR_PLAN_SYSTEM },
          {
            role: "user",
            content: `Plot: ${data.plot}. Configuration: ${data.bhk} BHK. Notes: ${data.brief || "none"}.`,
          },
        ],
        { json: true },
      );
    } catch (err) {
      await refund();
      throw err;
    }

    let rooms: PlanRoom[] = [];
    try {
      const parsed = JSON.parse(raw) as { rooms?: PlanRoom[] };
      rooms = (parsed.rooms ?? []).filter(
        (r) => r && typeof r.w === "number" && typeof r.h === "number",
      );
    } catch {
      await refund();
      throw new Error("The plan came back malformed. Please try again.");
    }
    if (rooms.length === 0) {
      await refund();
      throw new Error("No rooms were returned. Try a different brief.");
    }

    rooms = rooms.map((r, i) => ({
      ...r,
      id: r.id || `r${i + 1}`,
      type: r.type || "bedroom",
    }));

    await supabase.from("generations").insert({
      user_id: userId,
      tool: "floor-plan",
      prompt: data.brief,
      settings: { bhk: data.bhk, plot: data.plot },
      plan_data: rooms,
      credits_spent: cost,
      status: "complete",
    });

    return { rooms, creditsLeft: creditsLeft ?? 0 };
  });

export const render3DFloorPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { rooms: PlanRoom[]; bhk: number; plot: string; stylePreset?: string | undefined }) =>
      input,
  )
  .handler(async ({ data, context }): Promise<{ url: string; creditsLeft: number }> => {
    const { supabase, userId } = context;
    const cost = 4;
    const { buildFloorPlan3DPrompt } = await import("@/lib/ai/prompts");
    const { generateImageBytes } = await import("@/lib/ai/archigen.server");

    const { data: creditsLeft, error: spendError } = await supabase.rpc("spend_credits", {
      _cost: cost,
      _reason: "3D floor-plan render",
    });
    if (spendError) throw new Error("Not enough credits. Top up on the Credits & Plans page.");

    const refund = async () => {
      await supabase.rpc("refund_credits", { _amount: cost, _reason: "3D floor-plan refund" });
    };

    let result: { bytes: Uint8Array; contentType: string; seed: number };
    try {
      const prompt = buildFloorPlan3DPrompt(
        data.rooms,
        data.bhk,
        data.plot,
        data.stylePreset || "photorealistic",
      );
      result = await generateImageBytes(prompt, undefined, "architecture", "16:9");
    } catch (err) {
      await refund();
      throw err;
    }

    const ext = result.contentType.includes("svg")
      ? "svg"
      : result.contentType.includes("png")
        ? "png"
        : "jpg";
    const imagePath = `${userId}/3d-plan-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("renders")
      .upload(imagePath, result.bytes, { contentType: result.contentType, upsert: false });
    if (uploadError) {
      await refund();
      throw new Error(uploadError.message);
    }

    await supabase.from("generations").insert({
      user_id: userId,
      tool: "floor-plan",
      prompt: `3D Isometric Cutaway: ${data.bhk} BHK (${data.plot})`,
      settings: {
        bhk: data.bhk,
        plot: data.plot,
        style_preset: data.stylePreset || "photorealistic",
        mode: "3d_isometric",
      },
      image_path: imagePath,
      plan_data: data.rooms,
      credits_spent: cost,
      status: "complete",
    });

    const { data: signed } = await supabase.storage
      .from("renders")
      .createSignedUrl(imagePath, 3600);
    return { url: signed?.signedUrl ?? "", creditsLeft: creditsLeft ?? 0 };
  });

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messages: { role: "user" | "assistant"; content: string }[] }) => input)
  .handler(async ({ data, context }): Promise<{ reply: string; creditsLeft: number }> => {
    const { supabase } = context;

    const cost = 1;
    const { chatCompletion } = await import("@/lib/ai/archigen.server");
    const { ASSISTANT_SYSTEM } = await import("@/lib/ai/prompts");

    const { data: creditsLeft, error: spendError } = await supabase.rpc("spend_credits", {
      _cost: cost,
      _reason: "assistant reply",
    });
    if (spendError) throw new Error("Not enough credits. Top up on the Credits & Plans page.");

    let reply: string;
    try {
      reply = await chatCompletion([
        { role: "system", content: ASSISTANT_SYSTEM },
        ...data.messages.slice(-10),
      ]);
    } catch (err) {
      await supabase.rpc("refund_credits", { _amount: cost, _reason: "assistant refund" });
      throw err;
    }

    return { reply, creditsLeft: creditsLeft ?? 0 };
  });

export type PaymentOrderResult = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  isTestMode?: boolean;
};

export const createPaymentOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { amountInRupees: number; credits: number; packTitle: string }) => input)
  .handler(async ({ data, context }): Promise<PaymentOrderResult> => {
    const keyId = process.env["RAZORPAY_KEY_ID"] || process.env["VITE_RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];

    if (!keyId || !keySecret) {
      console.info(
        "[ArchiGen Payment] Razorpay keys not configured. Running in Test Checkout Mode.",
      );
      return {
        orderId: `order_test_${Date.now()}`,
        amount: data.amountInRupees * 100,
        currency: "INR",
        keyId: "rzp_test_demo",
        isTestMode: true,
      };
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: data.amountInRupees * 100,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: {
          userId: context.userId,
          credits: String(data.credits),
          packTitle: data.packTitle,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Razorpay Order creation failed: ${errText.slice(0, 200)}`);
    }

    const order = (await res.json()) as Record<string, unknown>;
    return {
      orderId: String(order["id"] || ""),
      amount: Number(order["amount"] || 0),
      currency: String(order["currency"] || "INR"),
      keyId,
    };
  });

export const verifyPaymentSignature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      orderId: string;
      paymentId: string;
      signature: string;
      credits: number;
      packTitle: string;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<{ success: boolean; creditsLeft: number }> => {
    const { supabase } = context;
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];

    // If test mode order, approve and grant credits
    if (data.orderId.startsWith("order_test_") || !keySecret) {
      const { data: creditsLeft, error } = await supabase.rpc("refund_credits", {
        _amount: data.credits,
        _reason: `Purchased ${data.packTitle} (${data.credits} credits)`,
      });
      if (error) throw new Error(error.message);
      return { success: true, creditsLeft: creditsLeft ?? 0 };
    }

    // Verify cryptographic signature with HMAC SHA256
    const { createHmac } = await import("crypto");
    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${data.orderId}|${data.paymentId}`)
      .digest("hex");

    if (expectedSignature !== data.signature) {
      throw new Error("Invalid Razorpay payment signature.");
    }

    // Credit user's account
    const { data: creditsLeft, error } = await supabase.rpc("refund_credits", {
      _amount: data.credits,
      _reason: `Purchased ${data.packTitle} (${data.credits} credits)`,
    });

    if (error) throw new Error(error.message);
    return { success: true, creditsLeft: creditsLeft ?? 0 };
  });
