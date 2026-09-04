import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HISTORY_FLASHCARDS } from "@/lib/study-data";
import { useStudyStore, studyActions } from "@/lib/study-store";

export const Route = createFileRoute("/flashcards")({
  validateSearch: (search: Record<string, unknown>) => ({
    subject: typeof search.subject === "string" && search.subject.trim() ? search.subject : "History",
  }),
  head: () => ({
    meta: [
      { title: "Flashcards — QuickStudy" },
      { name: "description", content: "Flip through interactive flashcards for each of your subjects on QuickStudy." },
      { property: "og:title", content: "Flashcards — QuickStudy" },
      { property: "og:description", content: "Flip through interactive flashcards for each of your subjects on QuickStudy." },
    ],
  }),
  component: FlashcardsPage,
});

function FlashcardsPage() {
  const { subject } = Route.useSearch();
  const { cardsBySubject, studiedCardIds } = useStudyStore();
  const cards = useMemo(
    () =>
      subject === "History"
        ? [...HISTORY_FLASHCARDS, ...(cardsBySubject["History"] ?? [])]
        : (cardsBySubject[subject] ?? []),
    [subject, cardsBySubject],
  );
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const safeIndex = Math.min(index, cards.length - 1);
  const card = cards.length > 0 ? cards[safeIndex]! : null;

  useEffect(() => {
    if (card) studyActions.markStudied(card.id);
  }, [card]);

  const goTo = (next: number) => {
    setIndex(next);
    setFlipped(false);
  };

  const addCard = () => {
    if (!question.trim() || !answer.trim()) return;
    studyActions.addFlashcard(subject, question, answer);
    setQuestion("");
    setAnswer("");
    goTo(cards.length); // jump to the new card
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:pt-16">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-sky/60 text-lg">🗂️</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-display">
            {subject} Flashcards
          </h1>
          <p className="text-sm text-ink/55">Tap the card to flip · {subject}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card-glass rounded-[2rem] p-6 sm:p-8">
          {card ? (
            <>
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-bold text-brand">
                  Card {safeIndex + 1} of {cards.length}
                </span>
                <span className="text-xs font-semibold text-ink/40">Tap to flip</span>
              </div>

              {/* Flip card */}
              <div
                className="perspective-flip mx-auto max-w-md cursor-pointer"
                onClick={() => setFlipped((f) => !f)}
                role="button"
                aria-label="Flip flashcard"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setFlipped((f) => !f)}
              >
                <div className={`flip-inner relative h-64 ${flipped ? "flipped" : ""}`}>
                  <div className="flip-face absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-brand/15 via-sky/25 to-accent/15 p-8 text-center shadow-inner outline-1 outline-white/50">
                    <span className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand">
                      Question
                    </span>
                    <p className="text-2xl font-bold leading-snug text-ink font-display text-balance">
                      {card.question}
                    </p>
                  </div>
                  <div className="flip-face flip-back absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-brand to-accent p-8 text-center shadow-lg shadow-brand/30">
                    <span className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                      Answer
                    </span>
                    <p className="text-2xl font-bold leading-snug text-white font-display text-balance">
                      {card.answer}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <button
                  onClick={() => goTo(Math.max(0, safeIndex - 1))}
                  disabled={safeIndex === 0}
                  className="rounded-full border border-brand/20 bg-white/60 px-5 py-2.5 font-bold text-ink/70 transition hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setFlipped((f) => !f)}
                  className="rounded-full bg-brand px-7 py-2.5 font-bold text-white shadow-md shadow-brand/30 transition hover:brightness-105"
                >
                  Flip card
                </button>
                <button
                  onClick={() => goTo(Math.min(cards.length - 1, safeIndex + 1))}
                  disabled={safeIndex === cards.length - 1}
                  className="rounded-full bg-accent px-5 py-2.5 font-bold text-white shadow-md shadow-accent/30 transition hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>

              <div className="mt-6 flex gap-1.5">
                {cards.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => goTo(i)}
                    aria-label={`Go to card ${i + 1}`}
                    className={`h-1.5 flex-1 rounded-full transition ${
                      i === safeIndex
                        ? "bg-brand"
                        : studiedCardIds.includes(c.id)
                          ? "bg-brand/40"
                          : "bg-ink/15"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-3 text-center text-xs font-semibold text-ink/40">
                {cards.filter((c) => studiedCardIds.includes(c.id)).length} of {cards.length} cards
                studied
              </p>
            </>
          ) : (
            <div className="py-16 text-center">
              <p className="text-lg font-bold text-ink font-display">No flashcards yet</p>
              <p className="mt-1 text-sm text-ink/55">
                Add your first {subject} flashcard using the form — it will only appear in this
                subject.
              </p>
            </div>
          )}
        </div>

        {/* Add flashcard */}
        <div className="card-glass rounded-[2rem] p-6">
          <h2 className="text-lg font-bold text-ink font-display">Add a {subject} flashcard</h2>
          <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-ink/45">
            Question
          </label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-brand/15 bg-white/70 px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-brand/40"
            placeholder="e.g. Who built the Great Pyramid?"
          />
          <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-ink/45">
            Answer
          </label>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCard()}
            className="mt-1.5 w-full rounded-2xl border border-brand/15 bg-white/70 px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-brand/40"
            placeholder="e.g. Pharaoh Khufu"
          />
          <button
            onClick={addCard}
            disabled={!question.trim() || !answer.trim()}
            className="mt-5 w-full rounded-2xl bg-brand py-3 font-bold text-white shadow-md shadow-brand/30 transition hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to {subject}
          </button>
          <Link
            to="/"
            className="mt-3 block text-center text-xs font-semibold text-ink/40 hover:text-brand"
          >
            ← Back to subjects
          </Link>
        </div>
      </div>
    </main>
  );
}
