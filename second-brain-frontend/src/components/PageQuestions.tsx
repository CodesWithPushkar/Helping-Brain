import { useCallback, useEffect, useState, type FormEvent } from "react";
import { MessageCircle, Plus } from "lucide-react";
import api from "../api/axios";

type Question = {
  id: number;
  content: string;
  created_by: { id: number; name: string };
  solutions: { id: number }[];
};

type PageQuestionsProps = {
  pageId: string;
  currentUserId?: number;
  reloadKey: number;
  onInsertQuestion: (questionId: number) => void;
};

export default function PageQuestions({
  pageId,
  currentUserId,
  reloadKey,
  onInsertQuestion,
}: PageQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionDraft, setQuestionDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadQuestions = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/page/${pageId}/questions`, {
        headers: { Authorization: token },
      });
      setQuestions(response.data.questions);
      setError("");
    } catch (loadError) {
      console.error("Page discussion load failed:", loadError);
      setError("Could not load questions. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadQuestions(), 0);
    return () => window.clearTimeout(timer);
  }, [loadQuestions, reloadKey]);

  async function addQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = questionDraft.trim();
    if (!content) return;
    setBusy(true);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        `/page/${pageId}/questions`,
        { content },
        { headers: { Authorization: token } },
      );
      setQuestionDraft("");
      onInsertQuestion(response.data.question.id);
      await loadQuestions();
    } catch (submitError) {
      console.error("Page question create failed:", submitError);
      setError("Could not post your question. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="max-h-[min(70dvh,32rem)] w-[min(22rem,calc(100vw-1rem))] overflow-y-auto rounded-xl border border-black/10 bg-white p-3 shadow-xl">
      <div className="mb-3 flex items-center gap-2">
        <MessageCircle size={16} className="text-[#8A641F]" />
        <div>
          <h2 className="text-sm font-semibold text-[#1B1E2A]">Insert a question block</h2>
          <p className="text-xs text-[#57536e]">It will appear at your cursor in the note.</p>
        </div>
      </div>

      {error && <p role="alert" className="mb-2 text-xs text-red-700">{error}</p>}
      {loading ? (
        <p className="py-2 text-sm text-[#57536e]">Loading questions…</p>
      ) : (
        <>
          {questions.length > 0 && (
            <div className="mb-3 max-h-40 space-y-1 overflow-y-auto">
              {questions.map((question) => (
                <button
                  type="button"
                  key={question.id}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => onInsertQuestion(question.id)}
                  className="w-full rounded-lg border border-black/[0.06] px-2.5 py-2 text-left hover:bg-[#FAF8F3]"
                >
                  <span className="block line-clamp-2 text-sm text-[#1B1E2A]">{question.content}</span>
                  <span className="mt-1 block text-xs text-[#57536e]">
                    {question.created_by.id === currentUserId ? "You" : question.created_by.name}
                    {" · "}{question.solutions.length} solution{question.solutions.length === 1 ? "" : "s"}
                  </span>
                </button>
              ))}
            </div>
          )}

          <form className="border-t border-black/[0.06] pt-3" onSubmit={(event) => void addQuestion(event)}>
            <label htmlFor="new-page-question" className="mb-1 block text-xs font-medium text-[#1B1E2A]">
              Or ask a new question
            </label>
            <textarea
              id="new-page-question"
              value={questionDraft}
              maxLength={5000}
              onChange={(event) => setQuestionDraft(event.target.value)}
              placeholder="What would you like to discuss?"
              className="min-h-20 w-full resize-y rounded-lg border border-black/10 p-2.5 text-sm outline-none focus:border-[#D8A34D]"
            />
            <button
              type="submit"
              disabled={busy || !questionDraft.trim()}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#1B1E2A] px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
            >
              <Plus size={15} />
              {busy ? "Posting…" : "Post and insert"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
