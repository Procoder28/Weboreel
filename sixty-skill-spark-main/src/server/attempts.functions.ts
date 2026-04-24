import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Use the publishable key on the server. The `attempts` table has RLS policies
// allowing anonymous insert + read, so no service role is needed.
function getServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type Difficulty = "easy" | "medium" | "hard";

export const recordAttempt = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      sessionId: string;
      difficulty: Difficulty;
      challengeType: string;
      challengePrompt: string;
      userAnswer: string;
      correct: boolean;
      score: number;
      timeTakenMs: number;
    }) => {
      if (!input.sessionId) throw new Error("sessionId required");
      if (input.score < 0 || input.score > 100) throw new Error("score out of range");
      return input;
    }
  )
  .handler(async ({ data }) => {
    const supabase = getServerClient();
    // Insert the attempt
    const { error: insertErr } = await supabase.from("attempts").insert({
      session_id: data.sessionId,
      difficulty: data.difficulty,
      challenge_type: data.challengeType,
      challenge_prompt: data.challengePrompt.slice(0, 2000),
      user_answer: data.userAnswer.slice(0, 1000),
      correct: data.correct,
      score: data.score,
      time_taken_ms: data.timeTakenMs,
    });
    if (insertErr) {
      console.error("recordAttempt insert error:", insertErr);
      // Don't fail the whole flow — return a sensible fallback
      return { percentile: 50, totalAttempts: 0, ok: false };
    }

    // Compute percentile: % of attempts with score <= this score
    const { count: totalCount } = await supabase
      .from("attempts")
      .select("*", { count: "exact", head: true });

    const { count: belowOrEqual } = await supabase
      .from("attempts")
      .select("*", { count: "exact", head: true })
      .lte("score", data.score);

    const total = totalCount ?? 1;
    const below = belowOrEqual ?? 1;
    const percentile = Math.max(1, Math.min(99, Math.round((below / total) * 100)));

    return { percentile, totalAttempts: total, ok: true };
  });
