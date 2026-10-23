import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import api from "../api/axios";

type StickyNote = {
  id: number;
  content: string;
  created_by_id: number;
  created_by: { id: number; name: string };
  created_at: string;
};

type PageStickyNotesProps = {
  pageId: string;
  currentUserId?: number;
  reloadKey: number;
  onClose: () => void;
};

export default function PageStickyNotes({
  pageId,
  currentUserId,
  reloadKey,
  onClose,
}: PageStickyNotesProps) {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadNotes = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/page/${pageId}/sticky-notes`, {
        headers: { Authorization: token },
      });
      setNotes(response.data.stickyNotes);
      setError("");
    } catch (loadError) {
      console.error("Sticky note load failed:", loadError);
      setError("Could not load sticky notes.");
    }
  }, [pageId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadNotes(), 0);
    return () => window.clearTimeout(timer);
  }, [loadNotes, reloadKey]);

  async function createNote() {
    const content = newContent.trim();
    if (!content) return;
    setBusy(true);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        `/page/${pageId}/sticky-notes`,
        { content },
        { headers: { Authorization: token } },
      );
      setNotes((current) => [...current, response.data.stickyNote]);
      setNewContent("");
      setError("");
    } catch (createError) {
      console.error("Sticky note create failed:", createError);
      setError("Could not save your sticky note.");
    } finally {
      setBusy(false);
    }
  }

  async function saveNote(noteId: number) {
    setBusy(true);
    try {
      const token = localStorage.getItem("token");
      const response = await api.patch(
        `/sticky-notes/${noteId}`,
        { content: editContent },
        { headers: { Authorization: token } },
      );
      setNotes((current) =>
        current.map((note) => note.id === noteId ? response.data.stickyNote : note),
      );
      setEditingId(null);
      setError("");
    } catch (saveError) {
      console.error("Sticky note save failed:", saveError);
      setError("Could not update this sticky note.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteNote(noteId: number) {
    setBusy(true);
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/sticky-notes/${noteId}`, { headers: { Authorization: token } });
      setNotes((current) => current.filter((note) => note.id !== noteId));
      setError("");
    } catch (deleteError) {
      console.error("Sticky note delete failed:", deleteError);
      setError("Could not delete this sticky note.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-label="Page sticky notes"
      className="fixed right-3 top-16 z-[60] flex max-h-[min(48dvh,24rem)] w-[min(21rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-black/10 bg-[#FFFDF7] shadow-xl sm:right-5 sm:top-20"
    >
      <header className="flex items-center justify-between border-b border-black/5 px-4 py-3">
        <div>
          <h2 className="font-serif text-base font-semibold text-[#1B1E2A]">Sticky notes</h2>
          <p className="text-[11px] text-[#1B1E2A]/50">Visible to page collaborators</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close sticky notes" className="rounded-full p-2 hover:bg-black/5">
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
        {notes.map((note) => {
          const canEdit = note.created_by_id === currentUserId;
          const isEditing = editingId === note.id;
          return (
            <article key={note.id} className="rounded-xl border border-[#EADFAE] bg-[#FFF4BF] p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-[#5F542C]">
                  {note.created_by.name}
                  {canEdit ? " · you" : ""}
                </span>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-1">
                    {isEditing ? (
                      <button type="button" disabled={busy} onClick={() => void saveNote(note.id)} aria-label="Save sticky note" className="rounded p-1 hover:bg-black/5">
                        <Save size={14} />
                      </button>
                    ) : (
                      <button type="button" onClick={() => { setEditingId(note.id); setEditContent(note.content); }} aria-label="Edit sticky note" className="rounded p-1 hover:bg-black/5">
                        <Pencil size={14} />
                      </button>
                    )}
                    <button type="button" disabled={busy} onClick={() => void deleteNote(note.id)} aria-label="Delete sticky note" className="rounded p-1 text-red-700 hover:bg-black/5">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              {isEditing ? (
                <textarea
                  value={editContent}
                  maxLength={2000}
                  onChange={(event) => setEditContent(event.target.value)}
                  className="min-h-20 w-full resize-y bg-transparent text-sm text-[#383326] outline-none"
                  aria-label="Edit sticky note content"
                />
              ) : (
                <p className="whitespace-pre-wrap break-words text-sm text-[#383326]">{note.content}</p>
              )}
            </article>
          );
        })}
      </div>

      <form
        className="border-t border-black/5 p-3"
        onSubmit={(event) => { event.preventDefault(); void createNote(); }}
      >
        <textarea
          value={newContent}
          maxLength={2000}
          onChange={(event) => setNewContent(event.target.value)}
          placeholder="Leave a note for your collaborators…"
          className="min-h-16 w-full resize-y rounded-lg border border-black/10 bg-white p-2 text-sm outline-none focus:border-[#D8A34D]"
          aria-label="New sticky note"
        />
        <button
          type="submit"
          disabled={busy || !newContent.trim()}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#1B1E2A] px-3 py-1.5 text-xs text-white disabled:opacity-50"
        >
          <Plus size={14} />
          Add sticky note
        </button>
      </form>
    </section>
  );
}
