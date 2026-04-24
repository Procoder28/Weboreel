import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

type Difficulty = "easy" | "medium" | "hard";
type ChallengeType = "mcq" | "logic" | "code-output" | "short";

const TYPES: ChallengeType[] = ["mcq", "logic", "code-output", "short"];

function buildSystemPrompt() {
  return `You are an expert challenge author for a 60-second skill-test app.
Generate ONE original, fun, brain-teaser style challenge. Rules:
- Keep the prompt SHORT and self-contained (max ~280 chars).
- Solvable mentally in under 60 seconds.
- The "expected" answer must be unambiguous and short.
- For MCQ: provide exactly 4 plausible options; the expected MUST be the EXACT text of the correct option.
- For code-output: use a tiny JS/Python snippet whose printed output is a single token.
- Never reveal the answer in the prompt.
- Vary topics: math, logic, lateral thinking, simple code reasoning.`;
}

function buildUserPrompt(difficulty: Difficulty, type: ChallengeType) {
  const diffNote =
    difficulty === "easy"
      ? "Easy: trivial-but-tricky, anyone can attempt."
      : difficulty === "medium"
        ? "Medium: needs a moment of thought."
        : "Hard: genuinely tricky; experts only.";
  return `Difficulty: ${difficulty}. ${diffNote}\nChallenge type: ${type}.\nReturn your challenge using the provided tool.`;
}

export const generateChallenge = createServerFn({ method: "POST" })
  .inputValidator((input: { difficulty: Difficulty; type?: ChallengeType }) => {
    if (!["easy", "medium", "hard"].includes(input.difficulty)) {
      throw new Error("Invalid difficulty");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const type = data.type ?? TYPES[Math.floor(Math.random() * TYPES.length)];

    const tools = [
      {
        type: "function",
        function: {
          name: "emit_challenge",
          description: "Emit a single challenge",
          parameters: {
            type: "object",
            properties: {
              prompt: { type: "string", description: "The challenge prompt shown to the user" },
              options: {
                type: "array",
                items: { type: "string" },
                description: "Exactly 4 options if type is mcq, otherwise omit",
              },
              expected: { type: "string", description: "The correct answer" },
            },
            required: ["prompt", "expected"],
            additionalProperties: false,
          },
        },
      },
    ];

    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(data.difficulty, type) },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "emit_challenge" } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit reached. Please wait a moment and try again.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Lovable workspace.");
      const t = await res.text();
      console.error("AI generation failed:", res.status, t);
      throw new Error("Failed to generate challenge");
    }

    const json = await res.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("AI returned no challenge");

    const args = JSON.parse(call.function.arguments);

    // Sanity-cleanup for MCQ
    if (type === "mcq") {
      if (!Array.isArray(args.options) || args.options.length !== 4) {
        throw new Error("AI returned invalid MCQ options");
      }
      // Make sure expected matches an option (compare loosely)
      const match = args.options.find(
        (o: string) => o.trim().toLowerCase() === String(args.expected).trim().toLowerCase()
      );
      if (match) args.expected = match;
    }

    return {
      id: crypto.randomUUID(),
      type,
      difficulty: data.difficulty,
      prompt: String(args.prompt),
      options: args.options,
      expected: String(args.expected),
    };
  });

export const evaluateAnswer = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      challenge: { type: ChallengeType; difficulty: Difficulty; prompt: string; expected: string };
      userAnswer: string;
      timeTakenMs: number;
    }) => input
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const { challenge, userAnswer, timeTakenMs } = data;

    // Trivial fast path for empty answers
    const trimmedAnswer = (userAnswer ?? "").trim();
    if (!trimmedAnswer) {
      return {
        correct: false,
        score: 0,
        confidence: 100,
        explanation: `Time's up — the correct answer was: "${challenge.expected}".`,
        feedback: "Don't freeze! Trust your gut and submit something next time.",
      };
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "emit_evaluation",
          description: "Evaluate the user's answer to a 60-second challenge",
          parameters: {
            type: "object",
            properties: {
              correct: { type: "boolean" },
              score: {
                type: "integer",
                minimum: 0,
                maximum: 100,
                description:
                  "0-100. 0 if completely wrong. 100 if perfectly correct AND fast (<10s). Reduce slightly for slow correct answers. Partial credit allowed for close-but-wrong.",
              },
              confidence: {
                type: "integer",
                minimum: 0,
                maximum: 100,
                description: "Your confidence in this judgement (0-100).",
              },
              explanation: {
                type: "string",
                description: "Plain, friendly 1-2 sentence explanation of the correct reasoning.",
              },
              feedback: {
                type: "string",
                description: "One short, punchy line of personality feedback to the user (max 90 chars).",
              },
            },
            required: ["correct", "score", "confidence", "explanation", "feedback"],
            additionalProperties: false,
          },
        },
      },
    ];

    const seconds = (timeTakenMs / 1000).toFixed(1);
    const userMsg = `Challenge type: ${challenge.type}
Difficulty: ${challenge.difficulty}
Prompt: ${challenge.prompt}
Expected answer: ${challenge.expected}
User's answer: ${trimmedAnswer}
Time taken: ${seconds}s

Be fair: small typos / case differences for short answers should still count as correct.
Use the emit_evaluation tool.`;

    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a strict-but-fair judge for a 60-second skill-test app. Evaluate user answers and emit structured feedback.",
          },
          { role: "user", content: userMsg },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "emit_evaluation" } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit reached. Please wait a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      const t = await res.text();
      console.error("AI evaluation failed:", res.status, t);
      throw new Error("Failed to evaluate answer");
    }

    const json = await res.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error("AI returned no evaluation");

    const args = JSON.parse(call.function.arguments);
    return {
      correct: Boolean(args.correct),
      score: Math.max(0, Math.min(100, Number(args.score) | 0)),
      confidence: Math.max(0, Math.min(100, Number(args.confidence) | 0)),
      explanation: String(args.explanation),
      feedback: String(args.feedback),
    };
  });
