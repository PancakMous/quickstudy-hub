import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HISTORY_QUIZ } from "@/lib/study-data";
import { studyActions } from "@/lib/study-store";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "History Quiz — QuickStudy" },
      { name: "description", content: "Test your History knowledge with a 10-question multiple-choice quiz on QuickStudy and see your final score." },
      { property: "og:title", content: "History Quiz — QuickStudy" },
      { property: "og:description", content: "Test your History knowledge with a 10-question multiple-choice quiz on QuickStudy and see your final score." },
    ],
  }),
  component: QuizPage,
});

const LETTERS = ["A", "B", "C", "D"];

function QuizPage() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => Array(HISTORY_QUIZ.length).fill(null),
  );
  const [finished, setFinished] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const question = HISTORY_QUIZ[index]!;
  const answered = answers.filter((a) => a !== null).length;
  const runningScore = answers.reduce<number>(
    (sum, a, i) => sum + (a === HISTORY_QUIZ[i]!.correctIndex ? 1 : 0),
    0,
  );

  const select = (choice: number) => {
    if (finished) return;
    setAnswers((prev) => prev.map((a, i) => (i === index ? choice : a)));
  };

  const finish = () => {
    const score = answers.reduce<number>(
      (sum, a, i) => sum + (a === HISTORY_QUIZ[i]!.correctIndex ? 1 : 0),
      0,
    );
    setFinalScore(score);
    setFinished(true);
    studyActions.recordQuiz(score, HISTORY_QUIZ.length);
  };

  const restart = () => {
    setAnswers(Array(HISTORY_QUIZ.length).fill(null));
    setIndex(0);
    setFinished(false);
    setFinalScore(null);
  };

  if (finished && finalScore !== null) {
    const percent = Math.round((finalScore / HISTORY_QUIZ.length) * 100);
    const message =
      percent === 100
        ? "Perfect score! History master. 🏆"
        : percent >= 80
          ? "Excellent work! 🌟"
          : percent >= 60
            ? "Good job — keep reviewing! 📚"
            : "Review the flashcards and try again! 💪";
    return (
      <main className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:pt-16">
        <div className="card-glass mx-auto max-w-xl rounded-[2rem] p-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-mint/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-ink/70">
            Quiz complete
          </span>
          <h1 className="mt-5 text-5xl font-bold text-ink font-display">
            {finalScore}
            <span className="text-2xl text-ink/40"> / {HISTORY_QUIZ.length}</span>
          </h1>
          <p className="mt-2 text-2xl font-bold text-brand font-display">{percent}%</p>
          <div className="mx-auto mt-4 h-3 max-w-xs rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-5 text-ink/60">{message}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              onClick={restart}
              className="rounded-full bg-brand px-6 py-3 font-bold text-white shadow-lg shadow-brand/30 transition hover:brightness-105"
            >
              Retake quiz
            </button>
            <Link
              to="/flashcards"
              className="rounded-full border border-brand/25 bg-white/60 px-6 py-3 font-bold text-brand transition hover:bg-white"
            >
              Review flashcards
            </Link>
            <Link
              to="/progress"
              className="rounded-full border border-brand/25 bg-white/60 px-6 py-3 font-bold text-brand transition hover:bg-white"
            >
              View progress
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:pt-16">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-accent/60 text-lg">✏️</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Quiz</h1>
          <p className="text-sm text-ink/55">Multiple choice · {HISTORY_QUIZ.length} questions · History</p>
        </div>
      </div>

      <div className="card-glass rounded-[2rem] p-6 sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <span className="rounded-full bg-accent/20 px-3 py-1 text-sm font-bold text-ink/70">
            Question {index + 1} of {HISTORY_QUIZ.length}
          </span>
          <span className="text-sm font-semibold text-ink/45">
            Score: {runningScore} / {answered}
          </span>
        </div>

        <div className="mb-6 flex gap-1.5">
          {HISTORY_QUIZ.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setIndex(i)}
              aria-label={`Go to question ${i + 1}`}
              className={`h-1.5 flex-1 rounded-full transition ${
                i === index ? "bg-accent" : answers[i] !== null ? "bg-brand/50" : "bg-ink/15"
              }`}
            />
          ))}
        </div>

        <p className="text-xl font-bold leading-snug text-ink font-display text-balance">
          {question.question}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {question.choices.map((choice, i) => {
            const selected = answers[index] === i;
            return (
              <button
                key={i}
                onClick={() => select(i)}
                className={`rounded-2xl px-5 py-4 text-left transition ${
                  selected
                    ? "border-2 border-accent bg-accent/20 font-bold text-ink shadow-md shadow-accent/20"
                    : "border border-brand/15 bg-white/70 font-semibold text-ink/60 hover:bg-white"
                }`}
              >
                <span className={`mr-2 font-bold ${selected ? "text-accent" : "text-ink/35"}`}>
                  {LETTERS[i]}.
                </span>
                {choice}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="rounded-full border border-brand/20 bg-white/60 px-5 py-2.5 font-bold text-ink/70 transition hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          {index < HISTORY_QUIZ.length - 1 ? (
            <button
              onClick={() => setIndex((i) => i + 1)}
              className="rounded-full bg-brand px-7 py-2.5 font-bold text-white shadow-md shadow-brand/30 transition hover:brightness-105"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={answered < HISTORY_QUIZ.length}
              className="rounded-full bg-accent px-7 py-2.5 font-bold text-white shadow-md shadow-accent/30 transition hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Finish quiz ({answered}/{HISTORY_QUIZ.length} answered)
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
