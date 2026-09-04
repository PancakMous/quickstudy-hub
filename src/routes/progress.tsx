import { createFileRoute, Link } from "@tanstack/react-router";
import { HISTORY_FLASHCARDS, HISTORY_QUIZ } from "@/lib/study-data";
import { useStudyStore } from "@/lib/study-store";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — QuickStudy" },
      { name: "description", content: "Track your QuickStudy learning progress: flashcards studied, quiz scores, and completion stats." },
      { property: "og:title", content: "Progress — QuickStudy" },
      { property: "og:description", content: "Track your QuickStudy learning progress: flashcards studied, quiz scores, and completion stats." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { studiedCardIds, customCards, lastQuiz, bestQuizPercent, quizzesTaken } = useStudyStore();

  const totalCards = HISTORY_FLASHCARDS.length + customCards.length;
  const studiedCount = studiedCardIds.length;
  const studiedPercent = totalCards > 0 ? Math.round((studiedCount / totalCards) * 100) : 0;
  const lastQuizPercent = lastQuiz ? Math.round((lastQuiz.score / lastQuiz.total) * 100) : null;

  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:pt-16">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-mint/70 text-lg">📈</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Progress</h1>
          <p className="text-sm text-ink/55">Your History learning at a glance</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-glass rounded-3xl p-6">
          <p className="text-sm font-semibold text-ink/50">Flashcards studied</p>
          <p className="mt-2 text-3xl font-bold text-ink font-display">
            {studiedCount}
            <span className="text-lg text-ink/40"> / {totalCards}</span>
          </p>
          <div className="mt-3 h-2.5 rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all"
              style={{ width: `${studiedPercent}%` }}
            />
          </div>
        </div>

        <div className="card-glass rounded-3xl p-6">
          <p className="text-sm font-semibold text-ink/50">Last quiz score</p>
          <p className="mt-2 text-3xl font-bold text-ink font-display">
            {lastQuiz ? (
              <>
                {lastQuiz.score}
                <span className="text-lg text-ink/40"> / {lastQuiz.total}</span>
              </>
            ) : (
              <span className="text-lg text-ink/40">Not taken yet</span>
            )}
          </p>
          <div className="mt-3 h-2.5 rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all"
              style={{ width: `${lastQuizPercent ?? 0}%` }}
            />
          </div>
        </div>

        <div className="card-glass rounded-3xl p-6">
          <p className="text-sm font-semibold text-ink/50">Best score</p>
          <p className="mt-2 text-3xl font-bold text-ink font-display">
            {bestQuizPercent !== null ? `${bestQuizPercent}%` : <span className="text-lg text-ink/40">—</span>}
          </p>
          <div className="mt-3 h-2.5 rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all"
              style={{ width: `${bestQuizPercent ?? 0}%` }}
            />
          </div>
        </div>

        <div className="card-glass rounded-3xl p-6">
          <p className="text-sm font-semibold text-ink/50">Quizzes completed</p>
          <p className="mt-2 text-3xl font-bold text-ink font-display">{quizzesTaken}</p>
          <p className="mt-3 text-xs font-semibold text-ink/40">
            {HISTORY_QUIZ.length} questions per quiz
          </p>
        </div>
      </div>

      {studiedCount === 0 && quizzesTaken === 0 && (
        <div className="card-glass mt-8 rounded-[2rem] p-8 text-center">
          <p className="text-lg font-bold text-ink font-display">Nothing here yet!</p>
          <p className="mt-1 text-sm text-ink/55">
            Start with the flashcards, then take the quiz to see your stats grow.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to="/flashcards"
              className="rounded-full bg-brand px-6 py-3 font-bold text-white shadow-lg shadow-brand/30 transition hover:brightness-105"
            >
              Study flashcards
            </Link>
            <Link
              to="/quiz"
              className="rounded-full border border-brand/25 bg-white/60 px-6 py-3 font-bold text-brand transition hover:bg-white"
            >
              Take the quiz
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
