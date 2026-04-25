import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  players: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        role: z.enum(["BAT", "BOWL", "AR", "WK"]),
        rating: z.number().min(0).max(100),
        tag: z.string().max(80).optional(),
      })
    )
    .min(11)
    .max(11),
  captainName: z.string().min(1).max(80),
});

const ToolSchema = {
  type: "function" as const,
  function: {
    name: "rate_csk_xi",
    description: "Rate a fantasy CSK XI and produce fan reactions.",
    parameters: {
      type: "object",
      properties: {
        overall: { type: "number", description: "Overall rating 0-100" },
        batting: { type: "number", description: "Batting strength 0-100" },
        bowling: { type: "number", description: "Bowling strength 0-100" },
        experience: { type: "number", description: "Experience 0-100" },
        teamTag: {
          type: "string",
          enum: ["Legendary XI", "Balanced Squad", "Chaos Team", "Whistle Podu Worthy", "Risky Pick"],
        },
        verdict: { type: "string", description: "One-sentence verdict, hype or roast." },
        reactions: {
          type: "array",
          minItems: 3,
          maxItems: 4,
          items: { type: "string" },
          description: "Short witty fan reactions, emojis allowed.",
        },
      },
      required: ["overall", "batting", "bowling", "experience", "teamTag", "verdict", "reactions"],
      additionalProperties: false,
    },
  },
};

export const analyzeTeam = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { error: "AI service is not configured. Please contact support." };
    }

    const roster = data.players
      .map((p, i) => `${i + 1}. ${p.name} (${p.role}, rating ${p.rating}${p.tag ? `, "${p.tag}"` : ""})`)
      .join("\n");

    const systemPrompt = `You are a witty IPL cricket pundit and CSK super-fan. Rate the user's dream Chennai Super Kings XI. Be honest, fun, sometimes savage. Use cricket terminology. Reactions should sound like real fan tweets — short, punchy, emoji-friendly. Examples: "Whistle Podu! 🦁", "Bro picked 5 all-rounders 💀", "Dhoni approves 😎", "Bowling attack looks paper thin 😬".`;

    const userPrompt = `Captain: ${data.captainName}\n\nPlaying XI:\n${roster}\n\nAnalyze this team. Score realistically (50-100). Consider role balance, star power, era mix.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [ToolSchema],
          tool_choice: { type: "function", function: { name: "rate_csk_xi" } },
        }),
      });

      if (!res.ok) {
        if (res.status === 429) return { error: "Too many requests. Please wait a moment and try again." };
        if (res.status === 402) return { error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." };
        const body = await res.text();
        console.error("AI gateway error:", res.status, body);
        return { error: "AI service is temporarily unavailable." };
      }

      const json = await res.json();
      const call = json.choices?.[0]?.message?.tool_calls?.[0];
      if (!call?.function?.arguments) {
        return { error: "AI returned no analysis. Please try again." };
      }
      const parsed = JSON.parse(call.function.arguments);
      return { result: parsed };
    } catch (e) {
      console.error("analyzeTeam failed:", e);
      return { error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
