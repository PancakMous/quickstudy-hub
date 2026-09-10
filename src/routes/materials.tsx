import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStudyStore, studyActions } from "@/lib/study-store";
import { generateStudyMaterialFromPdf } from "@/lib/pdf-study.functions";

export const Route = createFileRoute("/materials")({
  head: () => ({
    meta: [
      { title: "Study Materials - QuickStudy" },
      {
        name: "description",
        content:
          "Upload your PDF notes and textbooks to QuickStudy, read them in the app, and turn them into flashcards.",
      },
      { property: "og:title", content: "Study Materials - QuickStudy" },
      {
        property: "og:description",
        content:
          "Upload your PDF notes and textbooks to QuickStudy, read them in the app, and turn them into flashcards.",
      },
    ],
  }),
  component: MaterialsPage,
});

type Material = {
  id: string;
  subject: string;
  file_name: string;
  file_size: number;
  storage_path: string;
  created_at: string;
};

const MAX_BYTES = 20 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MaterialsPage() {
  const { extraSubjects } = useStudyStore();
  const subjects = ["History", ...extraSubjects];

  const [subject, setSubject] = useState("History");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [openDoc, setOpenDoc] = useState<{ material: Material; url: string } | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saved, setSaved] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [genMessage, setGenMessage] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadMaterials = useCallback(async () => {
    const { data, error: listError } = await supabase
      .from("study_materials")
      .select("id, subject, file_name, file_size, storage_path, created_at")
      .order("created_at", { ascending: false });
    if (!listError && data) setMaterials(data as Material[]);
    setLoadingList(false);
  }, []);

  useEffect(() => {
    void loadMaterials();
  }, [loadMaterials]);

  const upload = async (file: File) => {
    setError(null);
    setSaved(false);
    setSelectedName(file.name);

    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("That file isn't a PDF. Please choose a file ending in .pdf.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`That file is ${formatSize(file.size)} - the limit is 20 MB.`);
      return;
    }

    setUploading(true);
    setProgress(8);
    const tick = window.setInterval(
      () => setProgress((p) => (p < 90 ? p + Math.max(1, Math.round((90 - p) / 8)) : p)),
      160,
    );

    try {
      const path = `${subject}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("study-pdfs")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("study_materials").insert({
        subject,
        file_name: file.name,
        file_size: file.size,
        storage_path: path,
        public_url: path,
      });
      if (insertError) throw insertError;

      setProgress(100);
      await loadMaterials();
      setSaved(true);
    } catch {
      setError("Upload failed. Please check your connection and try again.");
    } finally {
      window.clearInterval(tick);
      setUploading(false);
      window.setTimeout(() => setProgress(0), 800);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const openMaterial = async (material: Material) => {
    const { data } = await supabase.storage
      .from("study-pdfs")
      .createSignedUrl(material.storage_path, 3600);
    if (data?.signedUrl) setOpenDoc({ material, url: data.signedUrl });
  };

  const removeMaterial = async (material: Material) => {
    await supabase.storage.from("study-pdfs").remove([material.storage_path]);
    await supabase.from("study_materials").delete().eq("id", material.id);
    if (openDoc?.material.id === material.id) setOpenDoc(null);
    await loadMaterials();
  };

  const generateFrom = async (material: Material) => {
    setGeneratingId(material.id);
    setGenMessage(null);
    setGenError(null);
    try {
      const result = await generateStudyMaterialFromPdf({
        data: { storagePath: material.storage_path },
      });
      studyActions.addFlashcards(material.subject, result.cards);
      studyActions.addQuizQuestions(material.subject, result.quiz);
      if (result.cards.length === 0 && result.quiz.length === 0) {
        setGenError("Nothing usable could be pulled out of that PDF.");
      } else {
        setGenMessage(
          `Read ${result.pages} page${result.pages === 1 ? "" : "s"} and made ${result.cards.length} flashcards and ${result.quiz.length} quiz questions for ${material.subject}.`,
        );
      }
    } catch (e) {
      const raw = e instanceof Error ? e.message : "";
      setGenError(
        raw.includes("RATE_LIMIT")
          ? "Too many requests right now - please try again in a moment."
          : raw.includes("NO_CREDITS")
            ? "Your AI credits have run out. Add credits to keep generating."
            : raw.includes("readable text")
              ? "This PDF has no readable text (it looks like scanned images), so nothing could be generated."
              : "Could not read that PDF. Please try again.",
      );
    } finally {
      setGeneratingId(null);
    }
  };

  const addCard = () => {
    if (!openDoc || !question.trim() || !answer.trim()) return;
    studyActions.addFlashcard(openDoc.material.subject, question, answer);
    setQuestion("");
    setAnswer("");
  };

  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 pb-14 sm:pt-16">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-peach/60 text-lg">📄</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-display">
            Study Materials
          </h1>
          <p className="text-sm text-ink/55">Upload PDF notes and turn them into flashcards.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Upload */}
        <section className="card-glass rounded-[2rem] p-6 sm:p-8">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wide text-ink/45">
              Add to subject
            </span>
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
                  s === subject
                    ? "bg-brand text-white shadow-md shadow-brand/30"
                    : "bg-white/60 text-ink/60 hover:bg-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void upload(file);
            }}
            className={`grid place-items-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition ${
              dragging ? "border-brand bg-brand/10" : "border-brand/25 bg-white/40"
            }`}
          >
            <span className="mb-3 grid size-14 place-items-center rounded-2xl bg-brand/10 text-2xl">
              ⬆️
            </span>
            <p className="font-bold text-ink font-display">Drag & drop your PDF here</p>
            <p className="mt-1 text-sm text-ink/50">PDF files only · up to 20 MB</p>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
              }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="mt-5 rounded-full bg-brand px-6 py-2.5 font-bold text-white shadow-md shadow-brand/30 transition hover:brightness-105 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Browse files"}
            </button>
          </div>

          {selectedName && (
            <p className="mt-4 truncate text-sm font-semibold text-ink/70">
              Selected: <span className="text-brand">{selectedName}</span>
            </p>
          )}

          {(uploading || progress > 0) && (
            <div className="mt-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs font-semibold text-ink/45">
                {progress >= 100 ? "Saved to your library" : `Uploading… ${progress}%`}
              </p>
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}
          {saved && !error && !uploading && (
            <p className="mt-4 rounded-2xl border border-mint bg-mint/40 px-4 py-3 text-sm font-semibold text-ink/70">
              Uploaded - it's now in your {subject} library below.
            </p>
          )}
        </section>

        {/* Library */}
        <aside className="card-glass rounded-[2rem] p-6">
          <h2 className="text-lg font-bold text-ink font-display">Your PDFs</h2>
          {loadingList ? (
            <p className="mt-4 text-sm text-ink/45">Loading…</p>
          ) : materials.length === 0 ? (
            <p className="mt-4 text-sm text-ink/45">
              Nothing uploaded yet. Your PDFs will appear here.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {materials.map((m) => (
                <li
                  key={m.id}
                  className="rounded-2xl border border-white/70 bg-white/60 p-3.5"
                >
                  <p className="truncate text-sm font-bold text-ink">{m.file_name}</p>
                  <p className="mt-0.5 text-xs text-ink/45">
                    {m.subject} · {formatSize(m.file_size)}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button
                      onClick={() => void generateFrom(m)}
                      disabled={generatingId !== null}
                      className="rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-brand/30 transition hover:brightness-105 disabled:opacity-50"
                    >
                      {generatingId === m.id ? "Reading PDF…" : "Make cards & quiz"}
                    </button>
                    <button
                      onClick={() => void openMaterial(m)}
                      className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand transition hover:bg-brand/20"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => void removeMaterial(m)}
                      className="rounded-full px-3 py-1.5 text-xs font-bold text-ink/40 transition hover:text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {generatingId && (
            <p className="mt-4 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 text-sm font-semibold text-ink/60">
              Reading the whole PDF and writing your cards and quiz… this can take a minute.
            </p>
          )}
          {genMessage && !generatingId && (
            <p className="mt-4 rounded-2xl border border-mint bg-mint/40 px-4 py-3 text-sm font-semibold text-ink/70">
              {genMessage}
            </p>
          )}
          {genError && !generatingId && (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {genError}
            </p>
          )}
        </aside>
      </div>

      {/* Reader */}
      {openDoc && (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="card-glass overflow-hidden rounded-[2rem] p-4">
            <div className="mb-3 flex items-center justify-between gap-3 px-2">
              <p className="truncate font-bold text-ink font-display">
                {openDoc.material.file_name}
              </p>
              <button
                onClick={() => setOpenDoc(null)}
                className="rounded-full px-3 py-1.5 text-xs font-bold text-ink/45 hover:text-brand"
              >
                Close
              </button>
            </div>
            <iframe
              title={openDoc.material.file_name}
              src={openDoc.url}
              className="h-[70vh] w-full rounded-2xl border border-white/70 bg-white"
            />
          </div>

          <div className="card-glass h-fit rounded-[2rem] p-6">
            <h2 className="text-lg font-bold text-ink font-display">
              Make a {openDoc.material.subject} flashcard
            </h2>
            <p className="mt-1 text-xs text-ink/45">Straight from what you're reading.</p>
            <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-ink/45">
              Question
            </label>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="mt-1.5 w-full rounded-2xl border border-brand/15 bg-white/70 px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-brand/40"
              placeholder="Ask yourself something"
            />
            <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-ink/45">
              Answer
            </label>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCard()}
              className="mt-1.5 w-full rounded-2xl border border-brand/15 bg-white/70 px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink/30 focus:border-brand/40"
              placeholder="The answer"
            />
            <button
              onClick={addCard}
              disabled={!question.trim() || !answer.trim()}
              className="mt-5 w-full rounded-2xl bg-brand py-3 font-bold text-white shadow-md shadow-brand/30 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add to {openDoc.material.subject}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
