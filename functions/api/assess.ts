// POST /api/assess — serves a human-vetted quiz for Imbila.AI Claude Academy modules.
// Questions come from the committed, reviewed quiz-bank.json (NOT generated live by AI),
// so the answer key is trustworthy and grading is deterministic. We serve a randomised
// subset per attempt and shuffle the options (remapping the correct index) for integrity.

import quizBank from "../../quiz-bank.json";

interface AssessRequest {
  module?: string;
  moduleId?: string;
}

type BankQuestion = { q: string; options: string[]; correct: number; explanation: string };

const QUESTIONS_PER_ATTEMPT =
  (quizBank as any)._meta?.questionsServedPerAttempt || 4;

// Fallback: map a module *title* to its bank id (the client normally sends moduleId).
const TITLE_TO_ID: Record<string, string> = {
  "introduction to ai fluency": "intro",
  "the 4d framework overview": "4d-overview",
  "delegation": "delegation",
  "description": "description",
  "effective prompting techniques": "prompting",
  "discernment": "discernment",
  "the description-discernment loop": "dd-loop",
  "diligence": "diligence",
  "claude 101": "claude-101",
  "building with the claude api": "api",
};

function resolveId(body: AssessRequest): string | null {
  if (body.moduleId && (quizBank as any)[body.moduleId]) return body.moduleId;
  if (body.module) {
    const t = body.module.replace(/&#8212;|—/g, "").replace(/&amp;/g, "&").toLowerCase().trim();
    if ((quizBank as any)[t]) return t;
    // match on the leading keyword(s) before any dash
    const head = t.split(/[-–—:]/)[0].trim();
    for (const [title, id] of Object.entries(TITLE_TO_ID)) {
      if (t.startsWith(title) || title.startsWith(head) || head.startsWith(title)) return id;
    }
  }
  return null;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const onRequestPost: PagesFunction = async (context) => {
  let body: AssessRequest;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = resolveId(body);
  const pool: BankQuestion[] = id ? ((quizBank as any)[id] as BankQuestion[]) : [];

  if (!pool || pool.length === 0) {
    return Response.json(
      { questions: [], error: "No vetted quiz is available for this module yet." },
      { status: 200 }
    );
  }

  // Pick a random subset, then shuffle each question's options and remap the correct index.
  const picked = shuffle(pool).slice(0, Math.min(QUESTIONS_PER_ATTEMPT, pool.length));
  const questions = picked.map((item) => {
    const tagged = item.options.map((text, i) => ({ text, isCorrect: i === item.correct }));
    const shuffled = shuffle(tagged);
    return {
      question: item.q,
      options: shuffled.map((o) => o.text),
      correct: shuffled.findIndex((o) => o.isCorrect),
      explanation: item.explanation,
    };
  });

  return Response.json({ questions, source: "vetted" });
};

// CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};
