import { createServerFn } from "@tanstack/react-start";
import type { MovieData, MovieFormData } from "@/lib/movie-types";

const SYSTEM_PROMPT = `You are a legendary Bollywood screenwriter who has scripted decades of blockbusters.
Given a person's life details, craft a dramatic, slightly exaggerated, deeply cinematic Bollywood movie about them.
Mix Hindi (in Roman script) with English in titles and dialogues — like real Bollywood marketing.
Be emotional, inspirational, dramatic. Tone matches Karan Johar / Sanjay Leela Bhansali / Rajkumar Hirani.
Always return ONLY valid JSON. No markdown, no commentary.`;

function buildPrompt(d: MovieFormData): string {
  return `Create a Bollywood movie based on this person:
- Name: ${d.name}
- Personality: ${d.personality}
- Life goal: ${d.goal}
- Biggest struggle: ${d.struggle}
- Love life: ${d.loveLife || "ek raaz hai"}
- Drama level (1-10): ${d.dramaLevel}

Return JSON with EXACTLY this shape:
{
  "title": "Hindi-English mix, dramatic, 2-5 words, like a real Bollywood title",
  "tagline": "One short punchy English tagline under the title",
  "genre": "e.g. Romantic Drama / Action Thriller / Coming-of-Age Musical",
  "cast": ["${d.name} as themselves", "Shah Rukh Khan as ...", "Alia Bhatt as ...", "Nawazuddin Siddiqui as ..."],
  "storyline": "3-4 sentences. Cinematic. Emotional. Use the person's real struggle and goal. Slightly exaggerated.",
  "dialogue": "ONE iconic dialogue in Hinglish. Punchy. Quotable. Under 18 words.",
  "songVibe": "One of: Romantic / Sad / Party / Motivational / Action",
  "yearReleased": "A year between 2024 and 2027"
}`;
}

export const generateMovie = createServerFn({ method: "POST" })
  .inputValidator((input: MovieFormData) => {
    if (!input || typeof input !== "object") throw new Error("Invalid input");
    if (!input.name || typeof input.name !== "string") throw new Error("Name required");
    return {
      name: String(input.name).slice(0, 60),
      personality: String(input.personality || "dramatic").slice(0, 60),
      goal: String(input.goal || "").slice(0, 200),
      struggle: String(input.struggle || "").slice(0, 200),
      loveLife: String(input.loveLife || "").slice(0, 120),
      dramaLevel: Math.min(10, Math.max(1, Number(input.dramaLevel) || 7)),
    };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildPrompt(data) },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "render_movie",
              description: "Return the Bollywood movie",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  tagline: { type: "string" },
                  genre: { type: "string" },
                  cast: { type: "array", items: { type: "string" } },
                  storyline: { type: "string" },
                  dialogue: { type: "string" },
                  songVibe: {
                    type: "string",
                    enum: ["Romantic", "Sad", "Party", "Motivational", "Action"],
                  },
                  yearReleased: { type: "string" },
                },
                required: [
                  "title",
                  "tagline",
                  "genre",
                  "cast",
                  "storyline",
                  "dialogue",
                  "songVibe",
                  "yearReleased",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "render_movie" } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return { error: "Bahut zyada requests! Thoda ruk ke try karein." } as const;
      }
      if (res.status === 402) {
        return { error: "AI credits khatam ho gaye. Workspace mein add kijiye." } as const;
      }
      const text = await res.text();
      console.error("AI gateway error", res.status, text);
      return { error: "Movie create nahi ho payi. Try again." } as const;
    }

    const json = await res.json();
    const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return { error: "AI ne reply nahi diya. Try again." } as const;
    }
    try {
      const movie = JSON.parse(toolCall.function.arguments) as MovieData;
      return { movie } as const;
    } catch (e) {
      console.error("Parse failed", e);
      return { error: "Reply samjh nahi aayi. Try again." } as const;
    }
  });
