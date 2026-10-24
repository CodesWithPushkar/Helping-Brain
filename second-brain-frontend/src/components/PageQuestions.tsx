import { useCallback, useEffect, useState } from "react";
import { MessageCircle, Plus, Send, Trash2 } from "lucide-react";
import api from "../api/axios";

type Author = { id: number; name: string };
type Solution = {
  id: number;
  content: string;
  created_at: string;
  created_by: Author;
};
type Question = {
  id: number;
  content: string;
  created_at: string;
  created_by: Author;
  solutions: Solution[];
};

type PageQuestionsProps = {
  pageId: string;
  currentUserId?: number;
  reloadKey: number;
};

export default function PageQuestions({ pageId, currentUserId, reloadKey }: PageQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionDraft, setQuestionDraft] = useState("");
  const [solutionDrafts, setSolutionDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
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
      setError("Could not load the questions and solutions.");
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadQuestions(), 0);
    return () => window.clearTimeout(timer);
  }, [loadQuestions, reloadKey]);

  async function addQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = questionDraft.trim();
    if (!content) return;
    setBusyKey("question");
    try {
      const token = localStorage.getItem("token");
      await api.post(
        `/page/${pageId}/questions`,
        { content },
        { headers: { Authorization: token } },
      );
      setQuestionDraft("");
      await loadQuestions();
    } catch (submitError) {
      console.error("Page question create failed:", submitError);
      setError("Could not post your question. Please try again.");
    } finally {
      setBusyKey(null);
    }
  }

  async function addSolution(event: React.FormEvent<HTMLFormElement>, questionId: number) {
    event.preventDefault();
    const content = (solutionDrafts[questionId] ?? "").trim();
    if (!content) return;
    setBusyKey(`solution-${questionId}`);
    try {
      const token = localStorage.getItem("token");
      await api.post(
        `/page-questions/${questionId}/solutions`,
        { content },
        { headers: { Authorization: token } },
      );
      setSolutionDrafts((drafts) => ({ ...drafts, [questionId]: "" }));
      await loadQuestions();
    } catch (submitError) {
      console.error("Page solution create failed:", submitError);
      setError("Could not post your solution. Please try again.");
    } finally {
      setBusyKey(null);
    }
  }

  async function deleteQuestion(question: Question) {
    if (!window.confirm("Delete this question and all its solutions?")) return;
    setBusyKey(`delete-question-${question.id}`);
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/page-questions/${question.id}`, {
        headers: { Authorization: token },
      });
      await loadQuestions();
    } catch (deleteError) {
      console.error("Page question delete failed:", deleteError);
      setError("Could not delete this question. Please try again.");
    } finally {
      setBusyKey(null);
    }
  }

  async function deleteSolution(solution: Solution) {
    if (!window.confirm("Delete this solution?")) return;
    setBusyKey(`delete-solution-${solution.id}`);
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/page-solutions/${solution.id}`, {
        headers: { Authorization: token },
      });
      await loadQuestions();
    } catch (deleteError) {
      console.error("Page solution delete failed:", deleteError);
      setError("Could not delete this solution. Please try again.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section
      aria-labelledby="page-discussion-heading"
      className="mt-6 border-t border-black/[0.08] pt-5 sm:mt-8 sm:pt-6"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5E7C7] text-[#74501C]">
          <MessageCircle size={18} />
        </span>
        <div>
          <h2 id="page-discussion-heading" className="font-serif text-lg font-semibold text-[#1B1E2A]">
            Questions &amp; solutions
          </h2>
          <p className="text-sm text-[#57536e]">
            Ask a question and let collaborators add different solutions.
          </p>
        </div>
      </div>

      {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
      {loading ? (
        <p className="py-3 text-sm text-[#57536e]">Loading discussion…</p>
      ) : questions.length === 0 ? (
        <p className="mb-4 rounded-xl bg-[#FAF8F3] px-3 py-3 text-sm text-[#57536e]">
          No questions yet. Start the discussion below.
        </p>
      ) : (
        <div className="mb-5 space-y-4">
          {questions.map((question) => (
            <article key={question.id} className="rounded-xl border border-[#E9E3D7] bg-[#FCFBF8] p-3 sm:p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-[#8A641F]">Question</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#57536e]">
                    Asked by <strong>{question.created_by.name}</strong>
                    {" · "}{new Date(question.created_at).toLocaleString()}
                  </span>
                  {question.created_by.id === currentUserId && (
                    <button
                      type="button"
                      aria-label="Delete question"
                      title="Delete question and its solutions"
                      disabled={busyKey === `delete-question-${question.id}`}
                      onClick={() => void deleteQuestion(question)}
                      className="rounded-md p-1.5 text-[#9A3E2E] hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#1B1E2A]">
                {question.content}
              </p>

              <div className="mt-4 space-y-3 border-l-2 border-[#E7D5AA] pl-3 sm:pl-4">
                {question.solutions.map((solution) => (
                  <div key={solution.id} className="rounded-lg bg-white p-3">
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#3F756A]">Solution</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#57536e]">
                          By <strong>{solution.created_by.name}</strong>
                          {" · "}{new Date(solution.created_at).toLocaleString()}
                        </span>
                        {solution.created_by.id === currentUserId && (
                          <button
                            type="button"
                            aria-label="Delete solution"
                            title="Delete solution"
                            disabled={busyKey === `delete-solution-${solution.id}`}
                            onClick={() => void deleteSolution(solution)}
                            className="rounded-md p-1.5 text-[#9A3E2E] hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#1B1E2A]">
                      {solution.content}
                    </p>
                  </div>
                ))}

                <form
                  className="flex flex-col gap-2 sm:flex-row"
                  onSubmit={(event) => void addSolution(event, question.id)}
                >
                  <textarea
                    value={solutionDrafts[question.id] ?? ""}
                    maxLength={5000}
                    onChange={(event) =>
                      setSolutionDrafts((drafts) => ({
                        ...drafts,
                        [question.id]: event.target.value,
                      }))
                    }
                    placeholder="Write a solution…"
                    aria-label={`Solution for question by ${question.created_by.name}`}
                    className="min-h-16 min-w-0 flex-1 resize-y rounded-lg border border-black/10 bg-white p-2.5 text-sm outline-none focus:border-[#3F8F82]"
                  />
                  <button
                    type="submit"
                    disabled={busyKey === `solution-${question.id}` || !(solutionDrafts[question.id] ?? "").trim()}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 self-end rounded-lg bg-[#1B1E2A] px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50 sm:self-stretch"
                  >
                    <Send size={14} />
                    Add solution
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}

      <form className="flex flex-col gap-2" onSubmit={(event) => void addQuestion(event)}>
        <label htmlFor="page-question" className="text-sm font-medium text-[#1B1E2A]">
          Ask a question
        </label>
        <textarea
          id="page-question"
          value={questionDraft}
          maxLength={5000}
          onChange={(event) => setQuestionDraft(event.target.value)}
          placeholder="What would you like to discuss?"
          className="min-h-20 w-full resize-y rounded-lg border border-black/10 bg-white p-3 text-sm outline-none focus:border-[#D8A34D]"
        />
        <button
          type="submit"
          disabled={busyKey === "question" || !questionDraft.trim()}
          className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg bg-[#1B1E2A] px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
        >
          <Plus size={16} />
          Post question
        </button>
      </form>
    </section>
  );
}
