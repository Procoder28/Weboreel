import { corsHeaders } from "@supabase/supabase-js/cors";

interface PredictRequest {
  total_classes: number;
  attended_classes: number;
  required_percentage?: number;
  remaining_classes: number;
  planned_leaves?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as PredictRequest;

    const total = Math.max(0, Number(body.total_classes) || 0);
    const attended = Math.max(0, Number(body.attended_classes) || 0);
    const required = Number(body.required_percentage) || 75;
    const remaining = Math.max(0, Number(body.remaining_classes) || 0);
    const leaves = Math.max(0, Number(body.planned_leaves) || 0);

    if (attended > total) {
      return new Response(
        JSON.stringify({ error: "Attended classes cannot exceed total classes." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (leaves > remaining) {
      return new Response(
        JSON.stringify({ error: "Planned leaves cannot exceed remaining classes." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const r = required / 100;
    const current_percentage = total > 0 ? (attended / total) * 100 : 0;

    const finalTotal = total + remaining;
    // Need x more attended such that (attended + x) / finalTotal >= r
    const minAttendNeeded = Math.max(0, Math.ceil(r * finalTotal - attended));
    const classes_needed = Math.min(remaining, minAttendNeeded);
    const reachable = minAttendNeeded <= remaining;

    // Max classes you can skip from remaining and still stay >= required at the end
    // (attended + (remaining - skip)) / finalTotal >= r
    // skip <= remaining - (r * finalTotal - attended)
    const classes_can_skip = Math.max(
      0,
      Math.floor(remaining - (r * finalTotal - attended)),
    );

    // Projected % if planned leaves are taken
    const projected_attended = attended + (remaining - leaves);
    const projected_percentage = finalTotal > 0 ? (projected_attended / finalTotal) * 100 : 0;

    let status: "Safe" | "Shortage" | "At Risk";
    if (!reachable) status = "Shortage";
    else if (projected_percentage >= required) status = "Safe";
    else status = "At Risk";

    // Weekly plan — assume 5 class days per week
    const weeks = Math.max(1, Math.ceil(remaining / 5));
    const perWeek = classes_needed > 0 ? Math.ceil(classes_needed / weeks) : 0;

    let plan = "";
    if (!reachable) {
      plan = `Even attending every one of the ${remaining} remaining classes brings you to ${(
        ((attended + remaining) / finalTotal) *
        100
      ).toFixed(1)}%, below the ${required}% target. Talk to your faculty about make-up options.`;
    } else if (classes_needed === 0) {
      plan = `You're already on track. You can safely skip up to ${classes_can_skip} of the remaining ${remaining} classes.`;
    } else {
      plan = `Attend at least ${classes_needed} of the next ${remaining} classes — roughly ${perWeek} per week over ${weeks} week${weeks > 1 ? "s" : ""}. You may skip up to ${classes_can_skip} class${classes_can_skip === 1 ? "" : "es"}.`;
    }

    const result = {
      current_percentage: Number(current_percentage.toFixed(2)),
      projected_percentage: Number(projected_percentage.toFixed(2)),
      status,
      classes_needed,
      classes_can_skip,
      remaining_classes: remaining,
      final_total: finalTotal,
      weekly_target: perWeek,
      weeks_remaining: weeks,
      plan,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
