import { useSyncExternalStore } from "react";
import type { Flashcard } from "./study-data";

export type StudyState = {
  customCards: Flashcard[];
  studiedCardIds: string[];
  lastQuiz: { score: number; total: number } | null;
  bestQuizPercent: number | null;
  quizzesTaken: number;
  extraSubjects: string[];
};

const STORAGE_KEY = "quickstudy-v1";

const DEFAULT_STATE: StudyState = {
  customCards: [],
  studiedCardIds: [],
  lastQuiz: null,
  bestQuizPercent: null,
  quizzesTaken: 0,
  extraSubjects: [],
};

function loadState(): StudyState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
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
    // storage unavailable — keep in-memory
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
  addFlashcard(question: string, answer: string) {
    const card: Flashcard = {
      id: `custom-${Date.now()}`,
      question: question.trim(),
      answer: answer.trim(),
    };
    setState({ customCards: [...state.customCards, card] });
  },
  markStudied(id: string) {
    if (state.studiedCardIds.includes(id)) return;
    setState({ studiedCardIds: [...state.studiedCardIds, id] });
  },
  recordQuiz(score: number, total: number) {
    const percent = Math.round((score / total) * 100);
    setState({
      lastQuiz: { score, total },
      bestQuizPercent:
        state.bestQuizPercent === null ? percent : Math.max(state.bestQuizPercent, percent),
      quizzesTaken: state.quizzesTaken + 1,
    });
  },
  addSubject(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState({ extraSubjects: [...state.extraSubjects, trimmed] });
  },
  resetProgress() {
    setState({ ...DEFAULT_STATE, customCards: state.customCards, extraSubjects: state.extraSubjects });
  },
};
