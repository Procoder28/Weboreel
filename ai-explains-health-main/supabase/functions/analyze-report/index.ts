// deno-lint-ignore-file no-explicit-any
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are MediExplain AI, a careful health-literacy assistant.
You read raw text extracted from a blood test report (or an image of one) and explain each parameter in plain, friendly language.

RULES:
- You are NOT a doctor. Always include safe, general wording. Never diagnose.
- Only include parameters you can clearly find in the input. Do NOT invent values.
- For each parameter, infer a sensible adult normal range if a reference is not provided in the report; mark "rangeSource" as "report" or "general".
- Status must be one of: "low" | "normal" | "high" | "unknown".
- Keep explanations short (1-2 sentences), warm, and jargon-free.
- "reasons" should be 2-4 SAFE, general lifestyle/contextual reasons (e.g. hydration, recent meal, exercise) — never alarming diagnoses.
- "tips" should be 2-4 simple, actionable lifestyle tips (diet, sleep, hydration, exercise).
- "summary" is a 2-3 sentence friendly overview of the whole report.
- Always include the disclaimer field exactly as specified.`;

const TOOL = {
  type: "function",
  function: {
    name: "explain_report",
    description: "Return a structured explanation of a blood test report.",
    parameters: {
      type: "object",
      properties: {
        patientHints: {
          type: "object",
          description: "Any non-identifying hints found (age range, sex). Optional.",
          properties: {
            ageRange: { type: "string" },
            sex: { type: "string" },
          },
          additionalProperties: false,
        },
        summary: { type: "string" },
        parameters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "e.g. Hemoglobin (Hb)" },
              value: { type: "string", description: "Reported value with unit if present" },
              unit: { type: "string" },
              normalRange: { type: "string", description: "e.g. 13.0–17.0" },
              rangeSource: { type: "string", enum: ["report", "general"] },
              status: { type: "string", enum: ["low", "normal", "high", "unknown"] },
              explanation: { type: "string" },
              reasons: { type: "array", items: { type: "string" } },
              tips: { type: "array", items: { type: "string" } },
            },
            required: ["name", "value", "normalRange", "status", "explanation", "reasons", "tips"],
            additionalProperties: false,
          },
        },
        disclaimer: { type: "string" },
      },
      required: ["summary", "parameters", "disclaimer"],
      additionalProperties: false,
    },
  },
} as const;

async function callLovableAI(messages: any[]) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      tools: [TOOL],
      tool_choice: { type: "function", function: { name: "explain_report" } },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    if (resp.status === 429) {
      return { error: "Rate limit exceeded. Please try again in a moment.", status: 429 };
    }
    if (resp.status === 402) {
      return { error: "AI credits exhausted. Please add funds to your Lovable workspace.", status: 402 };
    }
    console.error("AI gateway error:", resp.status, text);
    return { error: "AI gateway error", status: 500 };
  }

  const data = await resp.json();
  const call = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) {
    return { error: "AI returned no structured output", status: 500 };
  }
  try {
    const parsed = JSON.parse(call.function.arguments);
    return { data: parsed, status: 200 };
  } catch (e) {
    console.error("JSON parse error:", e, call.function.arguments);
    return { error: "Could not parse AI output", status: 500 };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { kind, text, imageBase64, mimeType, fileName } = body ?? {};

    if (!kind || (kind === "text" && !text) || (kind === "image" && !imageBase64)) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userContent: any =
      kind === "image"
        ? [
            {
              type: "text",
              text: `This is an image of a blood test report (file: ${fileName ?? "report"}). Read all values via OCR and analyze.`,
            },
            { type: "image_url", image_url: { url: `data:${mimeType ?? "image/png"};base64,${imageBase64}` } },
          ]
        : `Blood test report text (file: ${fileName ?? "report"}):\n\n${text}`;

    const result = await callLovableAI([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ]);

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Always enforce disclaimer
    const out = result.data;
    out.disclaimer =
      "This explanation is for educational purposes only and is NOT medical advice. Always consult a qualified healthcare professional about your results.";

    return new Response(JSON.stringify(out), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
