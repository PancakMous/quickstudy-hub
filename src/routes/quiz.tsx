import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HISTORY_QUIZ, HISTORY_FLASHCARDS, type QuizQuestion, type Flashcard } from "@/lib/study-data";
import { studyActions, useStudyStore } from "@/lib/study-store";

export const Route = createFileRoute("/quiz")({
  validateSearch: (search: Record<string, unknown>) => ({
    subject:
      typeof search["subject"] === "string" && search["subject"].trim()
        ? search["subject"]
        : "History",
  }),
  head: () => ({
    meta: [
      { title: "Quiz - QuickStudy" },
      { name: "description", content: "Test your knowledge with a multiple-choice quiz on any of your QuickStudy subjects and see your final score." },
      { property: "og:title", content: "Quiz - QuickStudy" },
      { property: "og:description", content: "Test your knowledge with a multiple-choice quiz on any of your QuickStudy subjects and see your final score." },
    ],
  }),
  component: QuizPage,
});

const LETTERS = ["A", "B", "C", "D"];

/** Shuffle (Fisher–Yates) without mutating the input. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Build a multiple-choice quiz from a subject's flashcards. */
function quizFromFlashcards(cards: Flashcard[]): QuizQuestion[] {
  const pool = cards.map((c) => c.answer);
  return cards.map((card, i) => {
    const distractors = shuffle(pool.filter((a) => a !== card.answer)).slice(0, 3);
    const choices = shuffle([card.answer, ...distractors]);
    return {
      id: `gen-${i}-${card.id}`,
      question: card.question,
      choices,
      correctIndex: choices.indexOf(card.answer),
    };
  });
}

function QuizPage() {
  const { subject } = Route.useSearch();
  const navigate = useNavigate();
  const { cardsBySubject, extraSubjects, quizQuestionsBySubject } = useStudyStore();

  const subjects = ["History", ...extraSubjects];
  const flashcardCount = (name: string) =>
    name === "History"
      ? HISTORY_FLASHCARDS.length + (cardsBySubject["History"]?.length ?? 0)
      : (cardsBySubject[name]?.length ?? 0);

  // Generated quizzes must stay stable across re-renders for a given subject.
  const [generatedFor, setGeneratedFor] = useState<string | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizQuestion[] | null>(null);

  const pdfQuestionCount = (name: string) => quizQuestionsBySubject[name]?.length ?? 0;

  const quiz: QuizQuestion[] | null = useMemo(() => {
    if (generatedFor === subject && generatedQuiz) return generatedQuiz;
    if (subject === "History") return HISTORY_QUIZ;
    return null;
  }, [subject, generatedFor, generatedQuiz]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const resetRun = () => {
    setAnswers([]);
    setIndex(0);
    setFinished(false);
    setFinalScore(null);
  };

  const buildQuiz = (name: string) => {
    // Questions generated from an uploaded PDF take priority.
    const fromPdf = quizQuestionsBySubject[name] ?? [];
    if (fromPdf.length > 0) {
      setGeneratedQuiz(shuffle(fromPdf).slice(0, 10));
      setGeneratedFor(name);
      return;
    }
    const cards = cardsBySubject[name] ?? [];
    if (cards.length < 4) {
      setGeneratedQuiz(null);
      setGeneratedFor(null);
      return;
    }
    setGeneratedQuiz(quizFromFlashcards(shuffle(cards).slice(0, 10)));
    setGeneratedFor(name);
  };

  // Whenever the selected subject changes, build its quiz and reset the run.
  useEffect(() => {
    resetRun();
    buildQuiz(subject);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, quizQuestionsBySubject]);

  const startSubjectQuiz = (name: string) => {
    if (name === subject) {
      resetRun();
      buildQuiz(name);
      return;
    }
    navigate({ to: "/quiz", search: { subject: name } });
  };

  const total = quiz?.length ?? 0;
  const padded = quiz ? Array.from({ length: total }, (_, i) => answers[i] ?? null) : [];
  const question = quiz ? quiz[Math.min(index, total - 1)]! : null;
  const answered = padded.filter((a) => a !== null).length;
  const runningScore = padded.reduce<number>(
    (sum, a, i) => sum + (quiz && a === quiz[i]!.correctIndex ? 1 : 0),
    0,
  );

  const select = (choice: number) => {
    if (finished || !quiz) return;
    setAnswers((prev) => {
      const next = Array.from({ length: quiz.length }, (_, i) => prev[i] ?? null);
      next[index] = choice;
      return next;
    });
  };

  const finish = () => {
    if (!quiz) return;
    const score = padded.reduce<number>(
      (sum, a, i) => sum + (a === quiz[i]!.correctIndex ? 1 : 0),
      0,
    );
    setFinalScore(score);
    setFinished(true);
    studyActions.recordQuiz(subject, score, quiz.length);
  };

  const restart = () => {
    if (subject !== "History") {
      startSubjectQuiz(subject);
      return;
    }
    setAnswers([]);
    setIndex(0);
    setFinished(false);
    setFinalScore(null);
  };

  const subjectPicker = (
    <div className="card-glass mb-6 rounded-[2rem] p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink/45">Choose a subject</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {subjects.map((name) => {
          const active = name === subject;
          const cards = flashcardCount(name);
          const quizReady = name === "History" ? true : cards >= 4 || pdfQuestionCount(name) > 0;
          return (
            <button
              key={name}
              onClick={() => quizReady && startSubjectQuiz(name)}
              disabled={!quizReady}
              title={quizReady ? undefined : `Add at least 4 flashcards to unlock a ${name} quiz`}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                active
                  ? "bg-brand text-white shadow-md shadow-brand/30"
                  : quizReady
                    ? "border border-brand/20 bg-white/60 text-ink/70 hover:bg-white"
                    : "border border-ink/10 bg-ink/5 text-ink/35 cursor-not-allowed"
              }`}
            >
              {name}
              {name !== "History" && (
                <span className={`ml-2 text-xs font-semibold ${active ? "text-white/75" : "text-ink/35"}`}>
                  {quizReady ? `${cards} cards` : "need 4 cards"}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {subject !== "History" &&
        pdfQuestionCount(subject) === 0 &&
        (cardsBySubject[subject]?.length ?? 0) < 4 && (
        <p className="mt-3 text-sm font-semibold text-ink/50">
          {subject} needs at least 4 flashcards to make a quiz -{" "}
          <Link to="/flashcards" search={{ subject }} className="text-brand hover:underline">
            add some here
          </Link>
          .
        </p>
      )}
    </div>
  );

  if (finished && finalScore !== null && quiz) {
    const percent = Math.round((finalScore / quiz.length) * 100);
    const message =
      percent === 100
        ? `Perfect score! ${subject} master. 🏆`
        : percent >= 80
          ? "Excellent work! 🌟"
          : percent >= 60
            ? "Good job - keep reviewing! 📚"
            : "Review the flashcards and try again! 💪";
    return (
      <main className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:pt-16">
        {subjectPicker}
        <div className="card-glass mx-auto max-w-xl rounded-[2rem] p-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-mint/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-ink/70">
            {subject} quiz complete
          </span>
          <h1 className="mt-5 text-5xl font-bold text-ink font-display">
            {finalScore}
            <span className="text-2xl text-ink/40"> / {quiz.length}</span>
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
              search={{ subject }}
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
          <p className="text-sm text-ink/55">
            Multiple choice · {total > 0 ? `${total} questions` : "pick a subject"} · {subject}
          </p>
        </div>
      </div>

      {subjectPicker}

      {quiz && question && (
        <div className="card-glass rounded-[2rem] p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <span className="rounded-full bg-accent/20 px-3 py-1 text-sm font-bold text-ink/70">
              Question {Math.min(index, total - 1) + 1} of {total}
            </span>
            <span className="text-sm font-semibold text-ink/45">
              Score: {runningScore} / {answered}
            </span>
          </div>

          <div className="mb-6 flex gap-1.5">
            {quiz.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setIndex(i)}
                aria-label={`Go to question ${i + 1}`}
                className={`h-1.5 flex-1 rounded-full transition ${
                  i === index ? "bg-accent" : padded[i] !== null ? "bg-brand/50" : "bg-ink/15"
                }`}
              />
            ))}
          </div>

          <p className="text-xl font-bold leading-snug text-ink font-display text-balance">
            {question.question}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {question.choices.map((choice, i) => {
              const selected = padded[index] === i;
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
            {index < total - 1 ? (
              <button
                onClick={() => setIndex((i) => i + 1)}
                className="rounded-full bg-brand px-7 py-2.5 font-bold text-white shadow-md shadow-brand/30 transition hover:brightness-105"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={answered < total}
                className="rounded-full bg-accent px-7 py-2.5 font-bold text-white shadow-md shadow-accent/30 transition hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Finish quiz ({answered}/{total} answered)
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
