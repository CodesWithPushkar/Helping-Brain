import { Node, mergeAttributes, type NodeViewProps } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import api from "../api/axios";
import RichSolutionEditor, {
  RichSolutionContent,
  type SavedSolution,
} from "../components/RichSolutionEditor";

type Author = { id: number; name: string };
type Solution = SavedSolution;
type Question = {
  id: number;
  content: string;
  created_at: string;
  created_by: Author;
  solutions: Solution[];
};

const PageQuestionBlock = Node.create({
  name: "pageQuestionBlock",
  group: "block",
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      pageId: { default: null },
      questionId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-page-question-block]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-page-question-block": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer((props: NodeViewProps) => <PageQuestionBlockView {...props} />);
  },
});

function PageQuestionBlockView({ node, deleteNode }: NodeViewProps) {
  const { pageId, questionId } = node.attrs as { pageId: string; questionId: number };
  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingSolutionId, setEditingSolutionId] = useState<number | null>(null);
  const [newSolutionOpen, setNewSolutionOpen] = useState(true);
  const [draftKey, setDraftKey] = useState(0);

  const loadQuestion = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/page/${pageId}/questions`, {
        headers: { Authorization: token },
      });
      const found = (response.data.questions as Question[]).find((item) => item.id === questionId);
      setQuestion(found ?? null);
      setError(found ? "" : "This question is no longer available.");
    } catch (loadError) {
      console.error("Question block load failed:", loadError);
      setError("Could not load this question.");
    }
  }, [pageId, questionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadQuestion(), 0);
    const handleDiscussionChange = (event: Event) => {
      const detail = (event as CustomEvent<{ pageId: number }>).detail;
      if (String(detail.pageId) === String(pageId)) void loadQuestion();
    };
    window.addEventListener("page:questions-changed", handleDiscussionChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("page:questions-changed", handleDiscussionChange);
    };
  }, [loadQuestion, pageId]);

  function updateSolution(saved: SavedSolution, created: boolean) {
    setQuestion((current) => {
      if (!current) return current;
      const exists = current.solutions.some((item) => item.id === saved.id);
      return {
        ...current,
        solutions: exists
          ? current.solutions.map((item) => item.id === saved.id ? saved : item)
          : [...current.solutions, saved],
      };
    });
    if (created) setNewSolutionOpen(false);
  }

  async function deleteQuestion() {
    if (!window.confirm("Delete this question and all its solutions?")) return;
    setBusy(true);
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/page-questions/${questionId}`, {
        headers: { Authorization: token },
      });
      deleteNode();
    } catch (deleteError) {
      console.error("Page question delete failed:", deleteError);
      setError("Could not delete this question.");
      setBusy(false);
    }
  }

  async function deleteSolution(solutionId: number) {
    if (!window.confirm("Delete this solution?")) return;
    setBusy(true);
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/page-solutions/${solutionId}`, {
        headers: { Authorization: token },
      });
      setQuestion((current) => current && ({
        ...current,
        solutions: current.solutions.filter((item) => item.id !== solutionId),
      }));
      if (editingSolutionId === solutionId) setEditingSolutionId(null);
    } catch (deleteError) {
      console.error("Page solution delete failed:", deleteError);
      setError("Could not delete this solution.");
    } finally {
      setBusy(false);
    }
  }

  function addAnotherSolution() {
    setDraftKey((key) => key + 1);
    setNewSolutionOpen(true);
  }

  return (
    <NodeViewWrapper className="my-4" contentEditable={false}>
      <section className="rounded-xl border border-[#E9E3D7] bg-[#FCFBF8] p-3 sm:p-4">
        {question ? (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#8A641F]">Question</span>
              <div className="flex items-center gap-2">
                <span className="text-right text-xs text-[#57536e]">
                  Asked by <strong>{question.created_by.name}</strong>
                  {" · "}{new Date(question.created_at).toLocaleString()}
                </span>
                <button
                  type="button"
                  aria-label="Delete question"
                  title="Delete question and solutions"
                  disabled={busy}
                  onClick={() => void deleteQuestion()}
                  className="rounded-md p-1.5 text-[#9A3E2E] hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#1B1E2A]">
              {question.content}
            </p>

            <div className="mt-4 space-y-3 border-l-2 border-[#E7D5AA] pl-3 sm:pl-4">
              {question.solutions.map((solution) => (
                <article key={solution.id} className="rounded-lg bg-white p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#3F756A]">Solution</span>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <span className="mr-1 text-right text-xs text-[#57536e]">
                        By <strong>{solution.created_by.name}</strong>
                        {" · "}{new Date(solution.created_at).toLocaleString()}
                        {solution.updated_by && (
                          <> · Edited by <strong>{solution.updated_by.name}</strong></>
                        )}
                      </span>
                      <button
                        type="button"
                        aria-label="Edit solution"
                        title="Edit solution"
                        disabled={busy}
                        onClick={() => setEditingSolutionId(
                          editingSolutionId === solution.id ? null : solution.id,
                        )}
                        className="rounded-md p-1.5 text-[#443F76] hover:bg-[#F4F0E6] disabled:opacity-50"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete solution"
                        title="Delete solution"
                        disabled={busy}
                        onClick={() => void deleteSolution(solution.id)}
                        className="rounded-md p-1.5 text-[#9A3E2E] hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {editingSolutionId === solution.id ? (
                    <RichSolutionEditor
                      key={`edit-${solution.id}`}
                      pageId={String(pageId)}
                      questionId={questionId}
                      solution={solution}
                      onSaved={updateSolution}
                      onFinish={() => setEditingSolutionId(null)}
                    />
                  ) : (
                    <RichSolutionContent content={solution.content} />
                  )}
                </article>
              ))}

              {newSolutionOpen ? (
                <article className="rounded-lg bg-white p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#3F756A]">
                    Add a solution
                  </div>
                  <RichSolutionEditor
                    key={`new-${draftKey}`}
                    pageId={String(pageId)}
                    questionId={questionId}
                    onSaved={updateSolution}
                  />
                </article>
              ) : (
                <button
                  type="button"
                  onClick={addAnotherSolution}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-[#443F76] hover:bg-[#F4F0E6]"
                >
                  <Plus size={15} /> Add another solution
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-red-700">{error || "Loading question…"}</p>
        )}
        {error && question && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
      </section>
    </NodeViewWrapper>
  );
}

export default PageQuestionBlock;
