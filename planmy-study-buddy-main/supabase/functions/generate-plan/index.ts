import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.105.1/cors";

interface PlanRequest {
  exam_date: string;
  hours_per_day: number;
  break_minutes: number;
  subjects: { name: string; difficulty: "Easy" | "Medium" | "Hard" }[];
  syllabus: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as PlanRequest;

    if (!body.exam_date || !body.hours_per_day || !body.subjects?.length) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const today = new Date().toISOString().slice(0, 10);
    const systemPrompt = `You are an expert academic study planner. Create a realistic, day-by-day study timetable.
Rules:
- Allocate more hours to harder subjects.
- Include short breaks between sessions (use the break minutes provided).
- Reserve the last 20% of days for revision and at least 2 mock test days near the end.
- Distribute syllabus topics across study days.
- Output strictly valid JSON matching the requested schema. No commentary.`;

    const userPrompt = `Today: ${today}
Exam date: ${body.exam_date}
Daily study hours available: ${body.hours_per_day}
Break between sessions (minutes): ${body.break_minutes}
Subjects (with difficulty): ${body.subjects.map((s) => `${s.name} (${s.difficulty})`).join(", ")}
Syllabus / topics: ${body.syllabus || "(not provided)"}

Generate the timetable.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "emit_plan",
              description: "Return the structured study plan.",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "Brief overview (2-3 sentences)." },
                  subject_allocation: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        subject: { type: "string" },
                        total_hours: { type: "number" },
                      },
                      required: ["subject", "total_hours"],
                      additionalProperties: false,
                    },
                  },
                  schedule: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string", description: "YYYY-MM-DD" },
                        day_label: { type: "string", description: "e.g. Day 1 — Mon" },
                        type: { type: "string", enum: ["study", "revision", "mock_test", "rest"] },
                        sessions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              subject: { type: "string" },
                              topic: { type: "string" },
                              duration_minutes: { type: "number" },
                            },
                            required: ["subject", "topic", "duration_minutes"],
                            additionalProperties: false,
                          },
                        },
                        notes: { type: "string" },
                      },
                      required: ["date", "day_label", "type", "sessions", "notes"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["summary", "subject_allocation", "schedule"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "emit_plan" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plan = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
