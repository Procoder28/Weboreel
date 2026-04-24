import { createServerFn } from "@tanstack/react-start";

const SYSTEM_PROMPT = `You are a cinematic narrator predicting someone's life 10 years from now. You write in second-person ("You..."), present tense, like a movie voiceover. Your tone is immersive, emotional, slightly dramatic — but always grounded in the user's choices. 5-7 vivid sentences. Reference concrete sensory details: a city, a room, a sound, a feeling.`;

const TOOL = {
  type: "function" as const,
  function: {
    name: "future_life",
    description: "Generate a personalized 10-year future scenario.",
    parameters: {
      type: "object",
      properties: {
        story: {
          type: "string",
          description: "5-7 sentence cinematic second-person narration of life 10 years from now.",
        },
        title: {
          type: "string",
          description: "Short evocative title, max 6 words. Example: 'The Architect of Quiet Mornings'",
        },
        setting: {
          type: "string",
          description: "One-word or two-word setting label. Examples: 'Tokyo Penthouse', 'Bali Studio', 'Berlin Loft'",
        },
        wealth: { type: "number", description: "0-100 wealth score" },
        happiness: { type: "number", description: "0-100 happiness score" },
        balance: { type: "number", description: "0-100 work-life balance score" },
        wealthLabel: { type: "string", description: "One word: e.g. Thriving, Comfortable, Stable, Unstable, Abundant" },
        vibe: {
          type: "string",
          enum: ["ambitious", "serene", "chaotic", "creative", "luxurious", "nomadic"],
          description: "Overall life vibe",
        },
        imagePrompt: {
          type: "string",
          description: "A short visual prompt for a futuristic AI image: cinematic, atmospheric, no text. e.g. 'a glass penthouse overlooking neon Tokyo at dusk, cinematic'",
        },
      },
      required: ["story", "title", "setting", "wealth", "happiness", "balance", "wealthLabel", "vibe", "imagePrompt"],
      additionalProperties: false,
    },
  },
};

export type FutureResult = {
  story: string;
  title: string;
  setting: string;
  wealth: number;
  happiness: number;
  balance: number;
  wealthLabel: string;
  vibe: "ambitious" | "serene" | "chaotic" | "creative" | "luxurious" | "nomadic";
  imagePrompt: string;
};

export const generateFuture = createServerFn({ method: "POST" })
  .inputValidator((input: { money: string; career: string; habits: string }) => {
    if (!input?.money || !input?.career || !input?.habits) {
      throw new Error("Missing answers");
    }
    return input;
  })
  .handler(async ({ data }): Promise<FutureResult> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = `Their answers:
- Money mindset: "${data.money}"
- Career ambition: "${data.career}"
- Daily habits: "${data.habits}"

Imagine their life 10 years from now. Be specific, sensory, and emotionally honest. Let the answers shape both the outcome (success / struggle / balance) and the setting. Add slight unpredictability so a retry could yield a different flavor.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "future_life" } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      const t = await res.text();
      console.error("AI error", res.status, t);
      throw new Error("AI generation failed");
    }

    const json = await res.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw new Error("No tool call in response");
    const parsed = JSON.parse(call.function.arguments) as FutureResult;
    return parsed;
  });