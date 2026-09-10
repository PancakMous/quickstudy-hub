import { useSyncExternalStore } from "react";
import type { Flashcard, QuizQuestion } from "./study-data";

export type SubjectQuizStats = {
  lastQuiz: { score: number; total: number } | null;
  bestQuizPercent: number | null;
  quizzesTaken: number;
};

export type StudyState = {
  /** Custom flashcards, keyed by subject name (e.g. "History", "Biology"). */
  cardsBySubject: Record<string, Flashcard[]>;
  studiedCardIds: string[];
  lastQuiz: { score: number; total: number } | null;
  bestQuizPercent: number | null;
  quizzesTaken: number;
  /** Quiz stats per subject name. */
  quizBySubject: Record<string, SubjectQuizStats>;
  /** Quiz questions generated from uploaded PDFs, keyed by subject name. */
  quizQuestionsBySubject: Record<string, QuizQuestion[]>;
  extraSubjects: string[];
};

export const EMPTY_QUIZ_STATS: SubjectQuizStats = {
  lastQuiz: null,
  bestQuizPercent: null,
  quizzesTaken: 0,
};

const STORAGE_KEY = "quickstudy-v2";

const DEFAULT_STATE: StudyState = {
  cardsBySubject: {},
  studiedCardIds: [],
  lastQuiz: null,
  bestQuizPercent: null,
  quizzesTaken: 0,
  quizBySubject: {},
  quizQuestionsBySubject: {},
  extraSubjects: [],
};

function loadState(): StudyState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
    // migrate v1: flat customCards belonged to History
    const legacy = window.localStorage.getItem("quickstudy-v1");
    if (legacy) {
      const old = JSON.parse(legacy);
      return {
        ...DEFAULT_STATE,
        ...old,
        cardsBySubject: old.customCards?.length ? { History: old.customCards } : {},
        customCards: undefined,
      };
    }
    return DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

let state: StudyState = loadState();
const listeners = new Set<() => void>();

function setState(next: Partial<StudyState>) {
  state = { ...state, ...next };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable - keep in-memory
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useStudyStore(): StudyState {
  return useSyncExternalStore(subscribe, () => state, () => DEFAULT_STATE);
}

export const studyActions = {
  addFlashcard(subject: string, question: string, answer: string) {
    const card: Flashcard = {
      id: `custom-${Date.now()}`,
      question: question.trim(),
      answer: answer.trim(),
    };
    const existing = state.cardsBySubject[subject] ?? [];
    setState({ cardsBySubject: { ...state.cardsBySubject, [subject]: [...existing, card] } });
  },
  addFlashcards(subject: string, cards: { question: string; answer: string }[]) {
    if (!cards.length) return;
    const stamp = Date.now();
    const existing = state.cardsBySubject[subject] ?? [];
    const seen = new Set(existing.map((c) => c.question.trim().toLowerCase()));
    const fresh: Flashcard[] = [];
    cards.forEach((c, i) => {
      const key = c.question.trim().toLowerCase();
      if (!key || !c.answer.trim() || seen.has(key)) return;
      seen.add(key);
      fresh.push({ id: `pdf-${stamp}-${i}`, question: c.question.trim(), answer: c.answer.trim() });
    });
    if (!fresh.length) return;
    setState({ cardsBySubject: { ...state.cardsBySubject, [subject]: [...existing, ...fresh] } });
  },
  addQuizQuestions(subject: string, questions: Omit<QuizQuestion, "id">[]) {
    if (!questions.length) return;
    const stamp = Date.now();
    const existing = state.quizQuestionsBySubject[subject] ?? [];
    const seen = new Set(existing.map((q) => q.question.trim().toLowerCase()));
    const fresh: QuizQuestion[] = [];
    questions.forEach((q, i) => {
      const key = q.question.trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      fresh.push({ id: `pdfq-${stamp}-${i}`, ...q, question: q.question.trim() });
    });
    if (!fresh.length) return;
    setState({
      quizQuestionsBySubject: {
        ...state.quizQuestionsBySubject,
        [subject]: [...existing, ...fresh],
      },
    });
  },
  markStudied(id: string) {
    if (state.studiedCardIds.includes(id)) return;
    setState({ studiedCardIds: [...state.studiedCardIds, id] });
  },
  recordQuiz(subject: string, score: number, total: number) {
    const percent = Math.round((score / total) * 100);
    const prev = state.quizBySubject[subject] ?? EMPTY_QUIZ_STATS;
    setState({
      lastQuiz: { score, total },
      bestQuizPercent:
        state.bestQuizPercent === null ? percent : Math.max(state.bestQuizPercent, percent),
      quizzesTaken: state.quizzesTaken + 1,
      quizBySubject: {
        ...state.quizBySubject,
        [subject]: {
          lastQuiz: { score, total },
          bestQuizPercent:
            prev.bestQuizPercent === null ? percent : Math.max(prev.bestQuizPercent, percent),
          quizzesTaken: prev.quizzesTaken + 1,
        },
      },
    });
  },
  addSubject(name: string) {
    const trimmed = name.trim();
    if (!trimmed || state.extraSubjects.includes(trimmed) || trimmed === "History") return;
    setState({ extraSubjects: [...state.extraSubjects, trimmed] });
  },
  resetProgress() {
    setState({ ...DEFAULT_STATE, cardsBySubject: state.cardsBySubject, extraSubjects: state.extraSubjects });
  },
};
