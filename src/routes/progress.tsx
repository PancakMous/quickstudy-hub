import { createFileRoute, Link } from "@tanstack/react-router";
import { HISTORY_FLASHCARDS, HISTORY_QUIZ } from "@/lib/study-data";
import { EMPTY_QUIZ_STATS, useStudyStore } from "@/lib/study-store";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress - QuickStudy" },
      { name: "description", content: "Track your QuickStudy progress subject by subject: flashcards studied, last quiz score, best score and quizzes completed." },
      { property: "og:title", content: "Progress - QuickStudy" },
      { property: "og:description", content: "Track your QuickStudy progress subject by subject: flashcards studied, last quiz score, best score and quizzes completed." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { studiedCardIds, cardsBySubject, quizBySubject, extraSubjects } = useStudyStore();

  const subjects = ["History", ...extraSubjects];
  const studied = new Set(studiedCardIds);

  const perSubject = subjects.map((subject) => {
    const cards =
      subject === "History"
        ? [...HISTORY_FLASHCARDS, ...(cardsBySubject["History"] ?? [])]
        : (cardsBySubject[subject] ?? []);
    const studiedCount = cards.filter((c) => studied.has(c.id)).length;
    const stats = quizBySubject[subject] ?? EMPTY_QUIZ_STATS;
    return {
      subject,
      total: cards.length,
      studiedCount,
      studiedPercent: cards.length > 0 ? Math.round((studiedCount / cards.length) * 100) : 0,
      stats,
      lastPercent: stats.lastQuiz
        ? Math.round((stats.lastQuiz.score / stats.lastQuiz.total) * 100)
        : null,
      quizLength: subject === "History" ? HISTORY_QUIZ.length : Math.min(cards.length, 10),
    };
  });

  const nothingYet =
    perSubject.every((s) => s.studiedCount === 0) &&
    perSubject.every((s) => s.stats.quizzesTaken === 0);

  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:pt-16">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-mint/70 text-lg">📈</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-display">Progress</h1>
          <p className="text-sm text-ink/55">Your learning, subject by subject</p>
        </div>
      </div>

      <div className="space-y-6">
        {perSubject.map((s) => (
          <section key={s.subject} className="card-glass rounded-[2rem] p-6 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-ink font-display">{s.subject}</h2>
                <p className="text-sm text-ink/50">
                  {s.total} flashcard{s.total === 1 ? "" : "s"}
                  {s.stats.quizzesTaken > 0
                    ? ` · ${s.stats.quizzesTaken} quiz${s.stats.quizzesTaken === 1 ? "" : "zes"} taken`
                    : " · no quizzes yet"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/flashcards"
                  search={{ subject: s.subject }}
                  className="rounded-full border border-brand/25 bg-white/60 px-4 py-2 text-sm font-bold text-brand transition hover:bg-white"
                >
                  Study
                </Link>
                <Link
                  to="/quiz"
                  search={{ subject: s.subject }}
                  className="rounded-full border border-brand/25 bg-white/60 px-4 py-2 text-sm font-bold text-brand transition hover:bg-white"
                >
                  Quiz
                </Link>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm font-semibold text-ink/50">Flashcards studied</p>
                <p className="mt-2 text-3xl font-bold text-ink font-display">
                  {s.studiedCount}
                  <span className="text-lg text-ink/40"> / {s.total}</span>
                </p>
                <div className="mt-3 h-2.5 rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all"
                    style={{ width: `${s.studiedPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-ink/50">Last quiz score</p>
                <p className="mt-2 text-3xl font-bold text-ink font-display">
                  {s.stats.lastQuiz ? (
                    <>
                      {s.stats.lastQuiz.score}
                      <span className="text-lg text-ink/40"> / {s.stats.lastQuiz.total}</span>
                    </>
                  ) : (
                    <span className="text-lg text-ink/40">Not taken yet</span>
                  )}
                </p>
                <div className="mt-3 h-2.5 rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all"
                    style={{ width: `${s.lastPercent ?? 0}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-ink/50">Best score</p>
                <p className="mt-2 text-3xl font-bold text-ink font-display">
                  {s.stats.bestQuizPercent !== null ? (
                    `${s.stats.bestQuizPercent}%`
                  ) : (
                    <span className="text-lg text-ink/40">-</span>
                  )}
                </p>
                <div className="mt-3 h-2.5 rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all"
                    style={{ width: `${s.stats.bestQuizPercent ?? 0}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-ink/50">Quizzes completed</p>
                <p className="mt-2 text-3xl font-bold text-ink font-display">
                  {s.stats.quizzesTaken}
                </p>
                <p className="mt-3 text-xs font-semibold text-ink/40">
                  {s.quizLength > 0 ? `${s.quizLength} questions per quiz` : "add cards to unlock"}
                </p>
              </div>
            </div>
          </section>
        ))}
      </div>

      {nothingYet && (
        <div className="card-glass mt-8 rounded-[2rem] p-8 text-center">
          <p className="text-lg font-bold text-ink font-display">Nothing here yet!</p>
          <p className="mt-1 text-sm text-ink/55">
            Start with the flashcards, then take the quiz to see your stats grow.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to="/flashcards"
              search={{ subject: "History" }}
              className="rounded-full bg-brand px-6 py-3 font-bold text-white shadow-lg shadow-brand/30 transition hover:brightness-105"
            >
              Study flashcards
            </Link>
            <Link
              to="/quiz"
              search={{ subject: "History" }}
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
