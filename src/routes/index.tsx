import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HISTORY_FLASHCARDS, HISTORY_QUIZ } from "@/lib/study-data";
import { useStudyStore, studyActions } from "@/lib/study-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuickStudy — Learn faster with flashcards and quizzes" },
      { name: "description", content: "Study History with interactive flashcards and quizzes. Track your progress and learn faster with QuickStudy." },
      { property: "og:title", content: "QuickStudy — Learn faster with flashcards and quizzes" },
      { property: "og:description", content: "Study History with interactive flashcards and quizzes. Track your progress and learn faster with QuickStudy." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { extraSubjects, cardsBySubject } = useStudyStore();
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [subjectName, setSubjectName] = useState("");

  const totalCards = HISTORY_FLASHCARDS.length + (cardsBySubject["History"] ?? []).length;

  const submitSubject = () => {
    if (!subjectName.trim()) return;
    studyActions.addSubject(subjectName);
    setSubjectName("");
    setShowNewSubject(false);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2.2rem] border border-white/60 bg-white/55 p-8 shadow-xl shadow-brand/10 backdrop-blur-xl sm:p-12">
        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-peach/50 blur-2xl" />
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-mint/60 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-ink/70">
            History · Ready to study
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl font-display">
            Learn faster with{" "}
            <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
              flashcards and quizzes.
            </span>
          </h1>
          <p className="mt-4 text-lg text-ink/60">
            Flip through cards, test yourself, and watch your mastery grow — one subject at a time.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/flashcards"
              search={{ subject: "History" }}
              className="rounded-full bg-brand px-6 py-3 font-bold text-white shadow-lg shadow-brand/30 transition hover:brightness-105"
            >
              Open History
            </Link>
            <button
              onClick={() => setShowNewSubject(true)}
              className="rounded-full border border-brand/25 bg-white/60 px-6 py-3 font-bold text-brand transition hover:bg-white"
            >
              Create new subject
            </button>
          </div>
        </div>
      </section>

      {/* My Subjects */}
      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-ink font-display">My Subjects</h2>
          <button
            onClick={() => setShowNewSubject(true)}
            className="text-sm font-semibold text-brand hover:underline"
          >
            Create New Subject
          </button>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Link
            to="/flashcards"
            search={{ subject: "History" }}
            className="group rounded-3xl border border-white/60 bg-gradient-to-br from-brand/12 to-accent/10 p-6 shadow-lg shadow-brand/10 backdrop-blur-xl transition hover:-translate-y-1"
          >
            <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-accent text-2xl shadow-md shadow-brand/30">
              📜
            </div>
            <h3 className="text-xl font-bold text-ink font-display">History</h3>
            <p className="mt-1 text-sm text-ink/55">
              WWI, WWII, Ancient Egypt & Rome, and the figures who shaped them.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-ink/60">
                {totalCards} flashcards
              </span>
              <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-ink/60">
                {HISTORY_QUIZ.length} quiz questions
              </span>
            </div>
          </Link>

          {extraSubjects.map((name) => {
            const count = (cardsBySubject[name] ?? []).length;
            return (
              <Link
                key={name}
                to="/flashcards"
                search={{ subject: name }}
                className="group rounded-3xl border border-white/60 bg-white/40 p-6 shadow-lg shadow-brand/10 backdrop-blur-xl transition hover:-translate-y-1"
              >
                <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-sky/60 text-2xl">
                  📚
                </div>
                <h3 className="text-xl font-bold text-ink font-display">{name}</h3>
                <p className="mt-1 text-sm text-ink/55">
                  {count === 0
                    ? "No cards yet — add flashcards to get started."
                    : `Your custom ${name} deck.`}
                </p>
                <div className="mt-4">
                  <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-ink/60">
                    {count} flashcard{count === 1 ? "" : "s"}
                  </span>
                </div>
              </Link>
            );
          })}

          {showNewSubject ? (
            <div className="rounded-3xl border-2 border-dashed border-brand/25 bg-white/30 p-6 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-ink font-display">New subject</h3>
              <input
                autoFocus
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitSubject()}
                placeholder="e.g. Geography"
                className="mt-3 w-full rounded-2xl border border-brand/15 bg-white/70 px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-brand/40"
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={submitSubject}
                  className="flex-1 rounded-full bg-brand py-2.5 text-sm font-bold text-white shadow-md shadow-brand/30 transition hover:brightness-105"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewSubject(false)}
                  className="rounded-full border border-brand/20 bg-white/60 px-4 py-2.5 text-sm font-bold text-ink/70 transition hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewSubject(true)}
              className="grid min-h-48 place-items-center rounded-3xl border-2 border-dashed border-brand/25 bg-white/30 p-6 text-center backdrop-blur-xl transition hover:bg-white/45"
            >
              <span>
                <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-brand/10 text-2xl text-brand">
                  ＋
                </span>
                <span className="block font-semibold text-ink/50">Add a subject</span>
                <span className="block text-xs text-ink/40">Science · Math · Geography</span>
              </span>
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
