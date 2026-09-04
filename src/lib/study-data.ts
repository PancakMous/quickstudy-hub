export type Flashcard = { id: string; question: string; answer: string };
export type QuizQuestion = {
  id: string;
  question: string;
  choices: string[];
  correctIndex: number;
};

export const HISTORY_FLASHCARDS: Flashcard[] = [
  { id: "fc1", question: "When did World War II end?", answer: "1945" },
  { id: "fc2", question: "When did World War I begin?", answer: "1914" },
  { id: "fc3", question: "Which treaty ended World War I?", answer: "The Treaty of Versailles (1919)" },
  { id: "fc4", question: "Which ancient civilization built the Great Pyramid of Giza?", answer: "Ancient Egypt" },
  { id: "fc5", question: "Who was the first Roman Emperor?", answer: "Augustus (Octavian), from 27 BC" },
  { id: "fc6", question: "What was the Roman Colosseum used for?", answer: "Gladiator contests and public spectacles" },
  { id: "fc7", question: "Who wrote the 95 Theses, sparking the Reformation?", answer: "Martin Luther (1517)" },
  { id: "fc8", question: "When did the French Revolution begin?", answer: "1789" },
  { id: "fc9", question: "Which event triggered U.S. entry into World War II?", answer: "The attack on Pearl Harbor (December 7, 1941)" },
  { id: "fc10", question: "Who was the Egyptian queen who allied with Julius Caesar and Mark Antony?", answer: "Cleopatra VII" },
];

export const HISTORY_QUIZ: QuizQuestion[] = [
  {
    id: "q1",
    question: "When did World War II end?",
    choices: ["1918", "1939", "1945", "1950"],
    correctIndex: 2,
  },
  {
    id: "q2",
    question: "Which event is generally considered the start of World War I?",
    choices: [
      "The invasion of Poland",
      "The assassination of Archduke Franz Ferdinand",
      "The sinking of the Lusitania",
      "The Battle of the Somme",
    ],
    correctIndex: 1,
  },
  {
    id: "q3",
    question: "The Great Pyramid of Giza was built as a tomb for which pharaoh?",
    choices: ["Ramesses II", "Tutankhamun", "Khufu", "Akhenaten"],
    correctIndex: 2,
  },
  {
    id: "q4",
    question: "Which empire was ruled by Augustus?",
    choices: ["Carthaginian Empire", "Roman Empire", "Byzantine Empire", "Ottoman Empire"],
    correctIndex: 1,
  },
  {
    id: "q5",
    question: "In which year did the French Revolution begin?",
    choices: ["1776", "1789", "1804", "1815"],
    correctIndex: 1,
  },
  {
    id: "q6",
    question: "What did Ancient Egyptians use to write on, made from a river plant?",
    choices: ["Parchment", "Papyrus", "Vellum", "Clay tablets"],
    correctIndex: 1,
  },
  {
    id: "q7",
    question: "Who was the leader of Nazi Germany during World War II?",
    choices: ["Benito Mussolini", "Joseph Stalin", "Adolf Hitler", "Winston Churchill"],
    correctIndex: 2,
  },
  {
    id: "q8",
    question: "The Roman Senate was primarily part of which period of Roman history?",
    choices: ["The Roman Kingdom", "The Roman Republic", "The Byzantine era", "The Holy Roman Empire"],
    correctIndex: 1,
  },
  {
    id: "q9",
    question: "Which wall divided a European capital from 1961 to 1989?",
    choices: ["The Warsaw Wall", "The Berlin Wall", "The Vienna Wall", "The Prague Wall"],
    correctIndex: 1,
  },
  {
    id: "q10",
    question: "Julius Caesar was assassinated on the Ides of March in which year?",
    choices: ["44 BC", "27 BC", "14 AD", "79 AD"],
    correctIndex: 0,
  },
];
