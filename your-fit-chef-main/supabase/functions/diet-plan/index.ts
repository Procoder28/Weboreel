import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DietRequest {
  age: number;
  gender: string;
  weight: number; // kg
  height: number; // cm
  goal: string; // loss | gain | maintain
  activity: string; // low | medium | high
  diet_type: string; // veg | nonveg | vegan
}

function calcBMR({ gender, weight, height, age }: DietRequest) {
  // Mifflin-St Jeor
  const base = 10 * weight + 6.25 * height - 5 * age;
  return gender === "female" ? base - 161 : base + 5;
}

function activityMultiplier(a: string) {
  return a === "low" ? 1.375 : a === "high" ? 1.725 : 1.55;
}

function goalAdjust(cal: number, goal: string) {
  if (goal === "loss") return Math.round(cal - 500);
  if (goal === "gain") return Math.round(cal + 400);
  return Math.round(cal);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: DietRequest = await req.json();
    const { age, gender, weight, height, goal, activity, diet_type } = body;

    if (!age || !weight || !height || !gender || !goal || !activity || !diet_type) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const heightM = height / 100;
    const bmi = +(weight / (heightM * heightM)).toFixed(1);
    const bmiCategory =
      bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";

    const bmr = calcBMR(body);
    const tdee = bmr * activityMultiplier(activity);
    const calories = goalAdjust(tdee, goal);
    const water = +(weight * 0.035).toFixed(1); // liters

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const systemPrompt = `You are an expert nutritionist and certified fitness coach. Generate practical, culturally diverse meal plans. Return ONLY valid JSON via the provided tool.`;

    const userPrompt = `Build a 1-day diet plan.
Profile: ${age}yo ${gender}, ${weight}kg, ${height}cm.
BMI: ${bmi} (${bmiCategory}). Goal: ${goal}. Activity: ${activity}. Diet: ${diet_type}.
Daily calorie target: ${calories} kcal. Water: ${water} L.
Distribute calories: breakfast 25%, lunch 35%, snacks 15%, dinner 25%.
Provide 2-3 specific meal items per slot with portion sizes. Suggest one exercise routine appropriate for the goal & activity level.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "build_diet_plan",
              description: "Returns the structured diet plan",
              parameters: {
                type: "object",
                properties: {
                  breakfast: {
                    type: "object",
                    properties: {
                      calories: { type: "number" },
                      items: { type: "array", items: { type: "string" } },
                    },
                    required: ["calories", "items"],
                  },
                  lunch: {
                    type: "object",
                    properties: {
                      calories: { type: "number" },
                      items: { type: "array", items: { type: "string" } },
                    },
                    required: ["calories", "items"],
                  },
                  snacks: {
                    type: "object",
                    properties: {
                      calories: { type: "number" },
                      items: { type: "array", items: { type: "string" } },
                    },
                    required: ["calories", "items"],
                  },
                  dinner: {
                    type: "object",
                    properties: {
                      calories: { type: "number" },
                      items: { type: "array", items: { type: "string" } },
                    },
                    required: ["calories", "items"],
                  },
                  exercise: {
                    type: "object",
                    properties: {
                      routine: { type: "string" },
                      duration_minutes: { type: "number" },
                    },
                    required: ["routine", "duration_minutes"],
                  },
                  tips: { type: "array", items: { type: "string" } },
                },
                required: ["breakfast", "lunch", "snacks", "dinner", "exercise", "tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "build_diet_plan" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit hit, please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    const plan = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    return new Response(
      JSON.stringify({
        bmi,
        bmi_category: bmiCategory,
        calories,
        water_liters: water,
        diet_plan: plan,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("diet-plan error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
