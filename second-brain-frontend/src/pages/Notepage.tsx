import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import css from "highlight.js/lib/languages/css";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import cpp from "highlight.js/lib/languages/cpp";
import axios from "axios";
import api from "../api/axios";
import "../editor.css";
import { useParams, useNavigate } from "react-router-dom";
import ButtonComponent from "../components/ButtonComponent";
import { Trash2, ArrowLeft, MoreVertical, Bold, Code2, Quote, Italic, List, ListOrdered, Link2, Sparkles, ExternalLink, ImagePlus, StickyNote as StickyNoteIcon, MessageCircle } from "lucide-react";
import PageLinkNode from "../extension/PageLinkNode";
import PageImageNode from "../extension/PageImageNode";
import ChatSidebar from "../layout/ChatSideBar";
import PageStickyNotes from "../components/PageStickyNotes";
import PageQuestions from "../components/PageQuestions";
import { markdownToTiptapHTML } from "../Markdowntotiptap";
import { io } from "socket.io-client";
import { apiOrigin } from "../api/axios";
import { userDetails } from "../hooks/useEffect/useUser";
import type { JSONContent } from "@tiptap/core";
import { mergePageContent, mergeTextChanges } from "../utils/mergePageContent";

const lowlight = createLowlight();
lowlight.register("css", css);
lowlight.register("javascript", js);
lowlight.register("typescript", ts);
lowlight.register("python", python);
lowlight.register("java", java);
lowlight.register("cpp", cpp);

export type PageOption = { id: number; title: string };

type PageUpdateEvent = {
  pageId: number;
  title: string;
  content: JSONContent | string | null;
  updatedAt: string;
  revision: number;
  updatedBy: { id: number; name: string } | null;
};

export default function NotePage() {
  const { id } = useParams();
  const pageId = id ?? "";
  const [title, setTitle] = useState("");
  const titleRef = useRef("");
  const [loaded, setLoaded] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkQuery, setLinkQuery] = useState("");
  const [externalLinkOpen, setExternalLinkOpen] = useState(false);
  const [externalLinkUrl, setExternalLinkUrl] = useState("");
  const [showStickyNotes, setShowStickyNotes] = useState(false);
  const [stickyNotesReloadKey, setStickyNotesReloadKey] = useState(0);
  const [questionsReloadKey, setQuestionsReloadKey] = useState(0);
  const [imageError, setImageError] = useState("");
  const [linkError, setLinkError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<"" | "saved" | "saving" | "error">("");
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [createdByName, setCreatedByName] = useState("");
  const [updatedByName, setUpdatedByName] = useState("");
  const [remoteUpdate, setRemoteUpdate] = useState<PageUpdateEvent | null>(null);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [chatSessionKey, setChatSessionKey] = useState(0);
  const [aiAdded, setAiAdded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseContentRef = useRef<JSONContent | null>(null);
  const baseTitleRef = useRef("");
  const expectedRevisionRef = useRef<number | null>(null);
  const editVersionRef = useRef(0);
  const remoteUpdateRef = useRef<PageUpdateEvent | null>(null);
  const savedEditorSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const navigate = useNavigate();
  const [pages, setPages] = useState<PageOption[]>([]);
  const isDirtyRef = useRef(false);
  const currentUser = userDetails().user;


  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: {
          openOnClick: true,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: "https",
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
        },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      PageLinkNode((pageId) => navigate(`/notes/${pageId}`)),
      PageImageNode,
    ],
    content: "",
    editorProps: {
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items ?? []).filter((item) =>
          item.type.startsWith("image/"),
        );
        if (items.length === 0) return false;
        event.preventDefault();
        void insertPastedImages(items);
        return true;
      },
    },
    onUpdate: () => {
      if (!isDirtyRef.current) setHasLocalDraft(true);
      isDirtyRef.current = true;
      editVersionRef.current += 1;
      scheduleSave(title);
    },
  });

  function scheduleSave(currentTitle: string) {
    if (!loaded) return;
    setSaveStatus("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const token = localStorage.getItem("token");
      let contentToSave: JSONContent | undefined = editor?.getJSON();
      let titleToSave = currentTitle;
      const pendingRemote = remoteUpdateRef.current;

      if (pendingRemote) {
        if (
          !baseContentRef.current ||
          typeof pendingRemote.content !== "object" ||
          pendingRemote.content === null ||
          !contentToSave
        ) {
          setSaveStatus("error");
          return;
        }

        const mergedContent = mergePageContent(
          baseContentRef.current,
          contentToSave,
          pendingRemote.content,
        );
        const mergedTitle = mergeTextChanges(
          baseTitleRef.current,
          currentTitle,
          pendingRemote.title,
        );
        if (!mergedContent || mergedTitle === null) {
          setSaveStatus("error");
          return;
        }

        contentToSave = mergedContent;
        titleToSave = mergedTitle;
        if (editor) {
          editor.commands.setContent(editor.schema.nodeFromJSON(mergedContent), {
            emitUpdate: false,
          });
        }
        setTitle(mergedTitle);
        titleRef.current = mergedTitle;
      }

      const editVersionAtSave = editVersionRef.current;
      try {
        const response = await api.patch(
          `/page/${pageId}`,
          {
            title: titleToSave,
            content: contentToSave,
            ...(expectedRevisionRef.current !== null && {
              expectedRevision: expectedRevisionRef.current,
            }),
          },
          { headers: { Authorization: token } }
        );
        const savedPage = response.data.page;
        baseContentRef.current = savedPage.content;
        baseTitleRef.current = savedPage.title;
        expectedRevisionRef.current = savedPage.revision;
        const pendingRemoteAfterSave = remoteUpdateRef.current;
        if (pendingRemoteAfterSave && pendingRemoteAfterSave.revision <= savedPage.revision) {
          remoteUpdateRef.current = null;
          setRemoteUpdate(null);
        }
        isDirtyRef.current = editVersionRef.current !== editVersionAtSave;
        setHasLocalDraft(isDirtyRef.current);
        setUpdatedByName(response.data.page.updated_by?.name ?? currentUser?.name ?? "");
        if (
          !isDirtyRef.current &&
          pendingRemoteAfterSave &&
          pendingRemoteAfterSave.revision > savedPage.revision
        ) {
          setTitle(pendingRemoteAfterSave.title);
          titleRef.current = pendingRemoteAfterSave.title;
          baseTitleRef.current = pendingRemoteAfterSave.title;
          baseContentRef.current =
            typeof pendingRemoteAfterSave.content === "object" &&
            pendingRemoteAfterSave.content !== null
              ? pendingRemoteAfterSave.content
              : { type: "doc", content: [] };
          expectedRevisionRef.current = pendingRemoteAfterSave.revision;
          editor?.commands.setContent(pendingRemoteAfterSave.content ?? "", {
            emitUpdate: false,
          });
          setUpdatedByName(pendingRemoteAfterSave.updatedBy?.name ?? "");
          remoteUpdateRef.current = null;
          setRemoteUpdate(null);
        }
        setSaveStatus(isDirtyRef.current ? "saving" : "saved");
        if (isDirtyRef.current) scheduleSave(titleRef.current);
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response?.status === 409 &&
          error.response.data?.page
        ) {
          const latestPage = error.response.data.page;
          const latest: PageUpdateEvent = {
            pageId: latestPage.id,
            title: latestPage.title,
            content: latestPage.content,
            updatedAt: latestPage.updated_at,
            revision: latestPage.revision,
            updatedBy: latestPage.updated_by,
          };
          expectedRevisionRef.current = latest.revision;
          remoteUpdateRef.current = latest;
          setRemoteUpdate(latest);
          setSaveStatus("saving");
          scheduleSave(titleRef.current);
          return;
        }
        console.error(
          "Page save failed:",
          error instanceof Error ? error.message : "Unknown error",
        );
        setSaveStatus("error");
      }
    }, 800);
  }

  function handleTitleChange(value: string) {
    if (!isDirtyRef.current) setHasLocalDraft(true);
    isDirtyRef.current = true;
    editVersionRef.current += 1;
    setTitle(value);
    titleRef.current = value;
    scheduleSave(value);
  }

  async function insertUploadedImage(file: File) {
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      setImageError("Choose a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Images must be 5 MB or smaller. The original image is kept without resizing.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await api.post(`/page/${pageId}/images`, file, {
        headers: { Authorization: token, "Content-Type": file.type },
      });
      editor?.chain().focus().insertContent({
        type: "pageImage",
        attrs: { imageId: response.data.imageId, alt: file.name },
      }).run();
      setImageError("");
    } catch (error) {
      console.error("Page image upload failed:", error);
      setImageError("Could not upload image. Please try again.");
    }
  }

  async function insertPastedImages(items: DataTransferItem[]) {
    for (const item of items) {
      const file = item.getAsFile();
      if (file) await insertUploadedImage(file);
    }
  }

  function applyExternalLink() {
    const rawUrl = externalLinkUrl.trim();
    if (!rawUrl || !editor) return;

    let href = rawUrl;
    if (!/^(https?:|mailto:)/i.test(href)) href = `https://${href}`;
    try {
      const parsed = new URL(href);
      if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) {
        setLinkError("Only web links and email links are supported.");
        return;
      }
    } catch {
      setLinkError("Enter a valid link.");
      return;
    }

    const selection = savedEditorSelectionRef.current ?? editor.state.selection;
    const chain = editor.chain().focus().setTextSelection(selection);
    if (selection.from === selection.to) {
      chain.insertContent({
        type: "text",
        text: rawUrl,
        marks: [{ type: "link", attrs: { href } }],
      }).run();
    } else {
      chain.setLink({ href }).run();
    }
    savedEditorSelectionRef.current = null;
    setExternalLinkUrl("");
    setExternalLinkOpen(false);
    setLinkError("");
  }

  function saveEditorSelection() {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    savedEditorSelectionRef.current = { from, to };
  }

  function handleAddToNote(content: string) {
    if (!editor) return;
    const html = markdownToTiptapHTML(content);
    editor.chain().focus().insertContentAt(editor.state.doc.content.size, html).run();
    setAiAdded(true);
    scheduleSave(title);
  }

  function insertPageLink(page: { id: number; title: string }) {
    if (!editor) return;
    const selection = savedEditorSelectionRef.current ?? editor.state.selection;
    editor.chain().focus().setTextSelection(selection).insertContent({
      type: "pageLink",
      attrs: { pageId: page.id, title: page.title },
    }).run();
    savedEditorSelectionRef.current = null;
    setLinkOpen(false);
    setLinkQuery("");
  }

  async function createAndLinkPage(newTitle: string) {
    const token = localStorage.getItem("token");
    const res = await api.post(
      "/create/page",
      { title: newTitle, workspaceId, parentPageId: null, icon: "Folder", color: "#D8A34D" },
      { headers: { Authorization: token } }
    );
    const newPage = res.data.page;
    setPages((currentPages) => [...currentPages, { id: newPage.id, title: newPage.title }]);
    insertPageLink({ id: newPage.id, title: newPage.title });
  }

  useEffect(() => {
    async function loadPage() {
      
      setLoaded(false);
      setTitle("");
      editor?.commands.setContent("");


      const token = localStorage.getItem("token");
      const res = await api.get(`/page/${pageId}`, {
        headers: { Authorization: token },
      });

      const page = res.data.page;
      setTitle(page.title);
      titleRef.current = page.title;
      baseTitleRef.current = page.title;
      baseContentRef.current = page.content ?? { type: "doc", content: [] };
      expectedRevisionRef.current = page.revision;
      remoteUpdateRef.current = null;
      isDirtyRef.current = false;
      setWorkspaceId(page.workspace_id);
      setCreatedByName(page.created_by?.name ?? "");
      setUpdatedByName(page.updated_by?.name ?? page.created_by?.name ?? "");

      editor?.commands.setContent(page.content ?? "", { emitUpdate: false });

      const workspacePagesRes = await api.get(`/pages?workspaceId=${page.workspace_id}`, {
        headers: { Authorization: token },
      });
      setPages(workspacePagesRes.data.pages);

      isDirtyRef.current = false;
      setHasLocalDraft(false);
      setLoaded(true);
    }

    if (editor) loadPage();
  }, [editor, pageId]);

  useEffect(() => {
    if (!editor || !loaded || !workspaceId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(apiOrigin, { auth: { token } });
    socket.on("connect", () => {
      socket.emit("workspace:join", { workspaceId }, (result: { success: boolean; error?: string }) => {
        if (!result.success) console.error("Workspace live updates unavailable:", result.error);
      });
    });

    socket.on("page:updated", (update: PageUpdateEvent) => {
      if (String(update.pageId) !== pageId || update.updatedBy?.id === currentUser?.id) return;

      if (isDirtyRef.current || editor.isFocused) {
        remoteUpdateRef.current = update;
        setRemoteUpdate(update);
        return;
      }

      setTitle(update.title);
      titleRef.current = update.title;
      baseTitleRef.current = update.title;
      baseContentRef.current =
        typeof update.content === "object" && update.content !== null
          ? update.content
          : { type: "doc", content: [] };
      expectedRevisionRef.current = update.revision;
      setUpdatedByName(update.updatedBy?.name ?? "");
      editor.commands.setContent(update.content ?? "", { emitUpdate: false });
      isDirtyRef.current = false;
      setHasLocalDraft(false);
      remoteUpdateRef.current = null;
      setRemoteUpdate(null);
    });

    socket.on("sticky-notes:changed", (event: { pageId: number }) => {
      if (String(event.pageId) === pageId) {
        setStickyNotesReloadKey((key) => key + 1);
      }
    });

    socket.on("page:questions-changed", (event: { pageId: number }) => {
      if (String(event.pageId) === pageId) {
        setQuestionsReloadKey((key) => key + 1);
      }
    });

    socket.on("page:deleted", (event: { pageId: number }) => {
      if (String(event.pageId) === pageId) navigate("/dashboard", { replace: true });
    });

    socket.on("connect_error", (error) => {
      console.error("Live collaboration connection failed:", error);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser?.id, editor, loaded, navigate, pageId, workspaceId]);

  function loadRemoteUpdate() {
    if (!remoteUpdate || !editor) return;
    setTitle(remoteUpdate.title);
    titleRef.current = remoteUpdate.title;
    baseTitleRef.current = remoteUpdate.title;
    baseContentRef.current =
      typeof remoteUpdate.content === "object" && remoteUpdate.content !== null
        ? remoteUpdate.content
        : { type: "doc", content: [] };
    expectedRevisionRef.current = remoteUpdate.revision;
    setUpdatedByName(remoteUpdate.updatedBy?.name ?? "");
    editor.commands.setContent(remoteUpdate.content ?? "", { emitUpdate: false });
    isDirtyRef.current = false;
    setHasLocalDraft(false);
    remoteUpdateRef.current = null;
    setRemoteUpdate(null);
  }

  if (!editor || !loaded) return null;

 return (
  <div className="min-h-screen bg-[#FAF8F3] px-3 py-4 pb-28 sm:px-6 sm:py-6 lg:px-10">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-black/5 text-sm text-[#1B1E2A]/80 shadow-sm hover:bg-black/[0.02] transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <span className="truncate text-xs text-[#1B1E2A]/40 font-mono tracking-tight sm:text-sm">
          Notes / <span className="text-[#1B1E2A]/60">{title || "Untitled"}</span>
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5 text-sm text-[#1B1E2A]/50">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              saveStatus === "saving"
                ? "bg-[#E2A63B]"
                : saveStatus === "error"
                  ? "bg-[#B4553F]"
                  : "bg-emerald-500"
            }`}
          />
          {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : ""}
          {saveStatus === "error" ? "Save failed" : ""}
        </div>
        <button className="p-1.5 rounded-full hover:bg-black/5 text-[#1B1E2A]/60 transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>
    </div>

    <div className="flex items-start gap-6 px-0 lg:px-5">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="min-w-0 flex-1 basis-full bg-transparent font-serif text-[30px] font-semibold leading-tight text-[#1B1E2A] outline-none placeholder:text-[#1B1E2A]/25 sm:basis-auto sm:text-[42px]"
          />

          <div className="flex items-center gap-2">
            <ButtonComponent
              icon={Sparkles}
              className="!bg-[#FAF8F3] !text-[#1B1E2A] !rounded-full !border !border-black/10 hover:!bg-[#F4EED8] shrink-0"
              onClick={() => {
                setShowChatSidebar(true);
                setChatSessionKey((prev) => prev + 1);
              }}
            />

            <ButtonComponent
              icon={Trash2}
              className="!bg-[#1B1E2A] !rounded-full hover:!bg-black shrink-0"
              onClick={async () => {
                const token = localStorage.getItem("token");
                await api.delete(`/page/${pageId}`, {
                  headers: { Authorization: token },
                });
                navigate("/dashboard");
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-[#1B1E2A]/40 mb-6">
          <span>Notes</span>
          {(updatedByName || createdByName) && (
            <span>Last edited by {updatedByName || createdByName}</span>
          )}
          {remoteUpdate && (
            <>
              {saveStatus === "error" && hasLocalDraft && (
                <span role="alert" className="text-xs text-[#9A3E2E]">
                  Your draft is still here. Copy it before loading latest; these edits could not
                  be merged automatically.
                </span>
              )}
              <button
                type="button"
                onClick={loadRemoteUpdate}
                className="rounded-full bg-[#F5D9A0] px-2 py-0.5 text-xs text-[#1B1E2A] hover:bg-[#EBC779]"
              >
                {hasLocalDraft ? "Discard my draft and load latest" : "Load latest"} from{" "}
                {remoteUpdate.updatedBy?.name ?? "a collaborator"}
              </button>
            </>
          )}
          {aiAdded && (
            <span className="text-xs font-medium text-[#8A5A16] bg-[#F5D9A0] px-2 py-0.5 rounded-full">
              AI-added
            </span>
          )}
        </div>

        <div className="h-px bg-black/[0.06] mb-6" />

        <div className="rounded-2xl border border-black/[0.06] bg-white px-3 py-3 shadow-sm sm:px-8 sm:py-6">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            className="hidden"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              void files.reduce(
                (promise, file) => promise.then(() => insertUploadedImage(file)),
                Promise.resolve(),
              );
              event.target.value = "";
            }}
          />
          <EditorContent
            editor={editor}
            className="prose prose-neutral max-w-none focus:outline-none min-h-[300px]"
          />
          {imageError && <p role="alert" className="mt-2 text-xs text-red-700">{imageError}</p>}
        </div>
        <PageQuestions pageId={pageId} reloadKey={questionsReloadKey} />
      </div>

      {showChatSidebar && (
        <ChatSidebar
          key={chatSessionKey}
          pageId={pageId}
          noteTitle={title}
          onAddToNote={handleAddToNote}
        />
      )}
    </div>

    {showStickyNotes && (
      <PageStickyNotes
        pageId={pageId}
        currentUserId={currentUser?.id}
        reloadKey={stickyNotesReloadKey}
        onClose={() => setShowStickyNotes(false)}
      />
    )}

    <div className="fixed bottom-3 left-1/2 z-50 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl bg-[#1B1E2A] px-2 py-2 shadow-xl sm:bottom-6 sm:rounded-full">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-3 py-1.5 rounded-full text-sm ${
          editor.isActive("bold") ? "bg-[#E2A63B] text-[#1B1E2A]" : "text-white/80 hover:bg-white/10"
        }`}
      >
        <Bold size={14} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-3 py-1.5 rounded-full text-sm ${
          editor.isActive("italic") ? "bg-[#E2A63B] text-[#1B1E2A]" : "text-white/80 hover:bg-white/10"
        }`}
      >
        <Italic size={14} />
      </button>

      <span className="w-px h-5 bg-white/15 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-2.5 py-1.5 rounded-full text-sm font-semibold ${
          editor.isActive("heading", { level: 1 }) ? "bg-[#E2A63B] text-[#1B1E2A]" : "text-white/80 hover:bg-white/10"
        }`}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2.5 py-1.5 rounded-full text-sm font-semibold ${
          editor.isActive("heading", { level: 2 }) ? "bg-[#E2A63B] text-[#1B1E2A]" : "text-white/80 hover:bg-white/10"
        }`}
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-2.5 py-1.5 rounded-full text-sm font-semibold ${
          editor.isActive("heading", { level: 3 }) ? "bg-[#E2A63B] text-[#1B1E2A]" : "text-white/80 hover:bg-white/10"
        }`}
      >
        H3
      </button>

      <span className="w-px h-5 bg-white/15 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-3 py-1.5 rounded-full text-sm ${
          editor.isActive("bulletList") ? "bg-[#E2A63B] text-[#1B1E2A]" : "text-white/80 hover:bg-white/10"
        }`}
      >
        <List size={14} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-3 py-1.5 rounded-full text-sm ${
          editor.isActive("orderedList") ? "bg-[#E2A63B] text-[#1B1E2A]" : "text-white/80 hover:bg-white/10"
        }`}
      >
        <ListOrdered size={14} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-3 py-1.5 rounded-full text-sm ${
          editor.isActive("blockquote") ? "bg-[#E2A63B] text-[#1B1E2A]" : "text-white/80 hover:bg-white/10"
        }`}
      >
        <Quote size={14} />
      </button>

      <span className="w-px h-5 bg-white/15 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`px-3 py-1.5 rounded-full text-sm ${
          editor.isActive("codeBlock") ? "bg-[#E2A63B] text-[#1B1E2A]" : "text-white/80 hover:bg-white/10"
        }`}
      >
        <Code2 size={14} />
      </button>

      {editor.isActive("codeBlock") && (
        <select
          value={editor.getAttributes("codeBlock").language || "javascript"}
          onChange={(e) =>
            editor.chain().focus().updateAttributes("codeBlock", { language: e.target.value }).run()
          }
          className="ml-1 bg-white/10 text-white text-sm rounded-full px-2 py-1.5 outline-none"
        >
          {["javascript", "typescript", "python", "java", "cpp", "css"].map((lang) => (
            <option key={lang} value={lang} className="text-black">{lang}</option>
          ))}
        </select>
      )}

      <button
        type="button"
        onMouseDown={(event) => {
          event.preventDefault();
          saveEditorSelection();
        }}
        onClick={() => setLinkOpen((open) => !open)}
        className="px-3 py-1.5 rounded-full text-sm text-white/80 hover:bg-white/10"
        title="Link to a page"
        aria-label="Link to a page"
      >
        <Link2 size={14} />
      </button>

      <button
        type="button"
        title="Add external link"
        aria-label="Add external link"
        onMouseDown={(event) => {
          event.preventDefault();
          saveEditorSelection();
        }}
        onClick={() => {
          setExternalLinkOpen((open) => !open);
          setLinkError("");
        }}
        className="rounded-full px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
      >
        <ExternalLink size={14} />
      </button>

      <button
        type="button"
        title="Add image"
        aria-label="Add image"
        onClick={() => imageInputRef.current?.click()}
        className="rounded-full px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
      >
        <ImagePlus size={14} />
      </button>
      <button
        type="button"
        title="Sticky notes"
        aria-label="Sticky notes"
        onClick={() => setShowStickyNotes((open) => !open)}
        className={`rounded-full px-3 py-1.5 text-sm ${
          showStickyNotes ? "bg-[#E2A63B] text-[#1B1E2A]" : "text-white/80 hover:bg-white/10"
        }`}
      >
        <StickyNoteIcon size={14} />
      </button>
      <button
        type="button"
        title="Questions and solutions"
        aria-label="Questions and solutions"
        onClick={() => {
          document.getElementById("page-discussion-heading")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }}
        className="rounded-full px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
      >
        <MessageCircle size={14} />
      </button>

    </div>
    {linkOpen && createPortal(
      <div className="fixed bottom-20 left-1/2 z-[60] mb-2 w-[min(20rem,calc(100vw-1rem))] -translate-x-1/2 rounded-xl border border-black/10 bg-white p-2 shadow-xl">
        <input
          autoFocus
          value={linkQuery}
          onChange={(event) => setLinkQuery(event.target.value)}
          placeholder="Search or create a page…"
          aria-label="Search or create a page"
          className="mb-2 w-full rounded-md border border-black/10 px-2 py-1.5 text-sm outline-none"
        />
        <div className="flex max-h-40 flex-col gap-0.5 overflow-y-auto">
          {pages
            .filter((page) => page.title.toLowerCase().includes(linkQuery.toLowerCase()))
            .map((page) => (
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                key={page.id}
                onClick={() => insertPageLink(page)}
                className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-black/5"
              >
                {page.title}
              </button>
            ))}

          {linkQuery.trim() && !pages.some(
            (page) => page.title.toLowerCase() === linkQuery.trim().toLowerCase()
          ) && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => createAndLinkPage(linkQuery.trim())}
              className="rounded-md px-2 py-1.5 text-left text-sm text-[#443F76] hover:bg-black/5"
            >
              + Create "{linkQuery.trim()}"
            </button>
          )}
        </div>
      </div>,
      document.body,
    )}
    {externalLinkOpen && createPortal(
      <form
        className="fixed bottom-20 left-1/2 z-[60] w-[min(20rem,calc(100vw-1rem))] -translate-x-1/2 rounded-xl border border-black/10 bg-white p-3 shadow-xl"
        onSubmit={(event) => { event.preventDefault(); applyExternalLink(); }}
      >
        <label className="mb-1 block text-xs font-medium text-[#1B1E2A]/60" htmlFor="external-link-url">
          Paste a web or email link
        </label>
        <div className="flex gap-2">
          <input
            id="external-link-url"
            autoFocus
            value={externalLinkUrl}
            onChange={(event) => setExternalLinkUrl(event.target.value)}
            placeholder="https://example.com"
            className="min-w-0 flex-1 rounded-md border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-[#D8A34D]"
          />
          <button type="submit" className="rounded-md bg-[#1B1E2A] px-3 text-sm text-white">Apply</button>
        </div>
        {linkError && <p role="alert" className="mt-2 text-xs text-red-700">{linkError}</p>}
      </form>,
      document.body,
    )}
  </div>
);
}