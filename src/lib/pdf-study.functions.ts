import { createServerFn } from "@tanstack/react-start";

export type GeneratedCard = { question: string; answer: string };
export type GeneratedQuizQuestion = {
  question: string;
  choices: string[];
  correctIndex: number;
};
export type GenerateResult = {
  cards: GeneratedCard[];
  quiz: GeneratedQuizQuestion[];
  pages: number;
  chunks: number;
  characters: number;
};

const CHUNK_SIZE = 14000;

function chunkText(text: string): string[] {
  const clean = text.replace(/\s+\n/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    let end = Math.min(i + CHUNK_SIZE, clean.length);
    if (end < clean.length) {
      const brk = clean.lastIndexOf("\n", end);
      if (brk > i + CHUNK_SIZE * 0.5) end = brk;
    }
    const piece = clean.slice(i, end).trim();
    if (piece.length > 80) chunks.push(piece);
    i = end;
  }
  return chunks;
}

const SYSTEM_PROMPT =
  "You create study material strictly from the provided source text. " +
  "Never invent facts, names, dates or numbers that are not present in the text. " +
  "If a section has too little usable content, return fewer items. " +
  "Write clear, self-contained questions. Answers must be short (max 15 words).";

const TOOL = {
  type: "function",
  function: {
    name: "emit_study_material",
    description: "Return flashcards and multiple-choice questions built from the source text.",
    parameters: {
      type: "object",
      properties: {
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
            },
            required: ["question", "answer"],
            additionalProperties: false,
          },
        },
        quiz: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              choices: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
              correctIndex: { type: "number" },
            },
            required: ["question", "choices", "correctIndex"],
            additionalProperties: false,
          },
        },
      },
      required: ["flashcards", "quiz"],
      additionalProperties: false,
    },
  },
} as const;

async function analyseChunk(
  chunk: string,
  apiKey: string,
  perChunk: number,
): Promise<{ flashcards: GeneratedCard[]; quiz: GeneratedQuizQuestion[] }> {
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
        {
          role: "user",
          content:
            `Create up to ${perChunk} flashcards and up to ${perChunk} multiple-choice questions ` +
            `(exactly 4 choices each, correctIndex is the 0-based index of the correct choice) ` +
            `using ONLY the following source text:\n\n"""\n${chunk}\n"""`,
        },
      ],
      tools: [TOOL],
      tool_choice: { type: "function", function: { name: "emit_study_material" } },
    }),
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 402) throw new Error("NO_CREDITS");
    throw new Error(`AI_ERROR_${res.status}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
  };
  const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return { flashcards: [], quiz: [] };
  try {
    const parsed = JSON.parse(args) as {
      flashcards?: GeneratedCard[];
      quiz?: GeneratedQuizQuestion[];
    };
    const flashcards = (parsed.flashcards ?? []).filter(
      (c) => typeof c?.question === "string" && typeof c?.answer === "string" && c.question.trim() && c.answer.trim(),
    );
    const quiz = (parsed.quiz ?? []).filter(
      (q) =>
        typeof q?.question === "string" &&
        Array.isArray(q?.choices) &&
        q.choices.length === 4 &&
        q.choices.every((c) => typeof c === "string" && c.trim()) &&
        typeof q?.correctIndex === "number" &&
        q.correctIndex >= 0 &&
        q.correctIndex < 4,
    );
    return { flashcards, quiz };
  } catch {
    return { flashcards: [], quiz: [] };
  }
}

export const generateStudyMaterialFromPdf = createServerFn({ method: "POST" })
  .inputValidator((input: { storagePath: string }) => {
    if (!input?.storagePath || typeof input.storagePath !== "string") {
      throw new Error("storagePath is required");
    }
    return input;
  })
  .handler(async ({ data }): Promise<GenerateResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("AI is not configured.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: file, error } = await supabaseAdmin.storage
      .from("study-pdfs")
      .download(data.storagePath);
    if (error || !file) throw new Error("Could not read that PDF.");

    const buffer = new Uint8Array(await file.arrayBuffer());
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(buffer);
    const { text, totalPages } = await extractText(pdf, { mergePages: true });
    const fullText = Array.isArray(text) ? text.join("\n") : text;

    if (!fullText || fullText.trim().length < 120) {
      throw new Error(
        "This PDF has no readable text (it may be a scan of images), so nothing could be generated.",
      );
    }

    const chunks = chunkText(fullText);
    // Keep every part of the document in play, but batch requests so long
    // documents still complete: more chunks -> fewer items requested per chunk.
    const perChunk = chunks.length > 12 ? 3 : chunks.length > 6 ? 4 : 6;

    const cards: GeneratedCard[] = [];
    const quiz: GeneratedQuizQuestion[] = [];
    const BATCH = 4;
    for (let i = 0; i < chunks.length; i += BATCH) {
      const results = await Promise.all(
        chunks.slice(i, i + BATCH).map((c) => analyseChunk(c, apiKey, perChunk)),
      );
      for (const r of results) {
        cards.push(...r.flashcards);
        quiz.push(...r.quiz);
      }
    }

    const seen = new Set<string>();
    const uniqueCards = cards.filter((c) => {
      const key = c.question.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const seenQ = new Set<string>();
    const uniqueQuiz = quiz.filter((q) => {
      const key = q.question.trim().toLowerCase();
      if (seenQ.has(key)) return false;
      seenQ.add(key);
      return true;
    });

    return {
      cards: uniqueCards,
      quiz: uniqueQuiz,
      pages: totalPages ?? 0,
      chunks: chunks.length,
      characters: fullText.length,
    };
  });
