import { useEffect, useState, useRef } from "react";
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
import api from "../api/axios";
import "../editor.css";
import { useParams, useNavigate } from "react-router-dom";
import ButtonComponent from "../components/ButtonComponent";
import { Trash2, ArrowLeft, MoreVertical, Bold, Code2, Quote, Italic, List, ListOrdered, Link2, Sparkles } from "lucide-react";
import PageLinkNode from "../extension/PageLinkNode";
import ChatSidebar from "../layout/ChatSideBar";
import { markdownToTiptapHTML } from "../Markdowntotiptap";
import { io } from "socket.io-client";
import { apiOrigin } from "../api/axios";
import { userDetails } from "../hooks/useEffect/useUser";
import type { JSONContent } from "@tiptap/core";

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
  updatedBy: { id: number; name: string } | null;
};

export default function NotePage() {
  const { id } = useParams();
  const pageId = id ?? "";
  const [title, setTitle] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkQuery, setLinkQuery] = useState("");
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<"" | "saved" | "saving" | "error">("");
  const [createdByName, setCreatedByName] = useState("");
  const [updatedByName, setUpdatedByName] = useState("");
  const [remoteUpdate, setRemoteUpdate] = useState<PageUpdateEvent | null>(null);
  const [showChatSidebar, setShowChatSidebar] = useState(false);
  const [chatSessionKey, setChatSessionKey] = useState(0);
  const [aiAdded, setAiAdded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const [pages, setPages] = useState<PageOption[]>([]);
  const isDirtyRef = useRef(false);
  const currentUser = userDetails().user;


  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      PageLinkNode((pageId) => navigate(`/notes/${pageId}`)),
    ],
    content: "",
    onUpdate: () => {
      isDirtyRef.current = true;
      scheduleSave(title);
    },
  });

  function scheduleSave(currentTitle: string) {
    if (!loaded) return;
    setSaveStatus("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await api.patch(
          `/page/${pageId}`,
          { title: currentTitle, content: editor?.getJSON() },
          { headers: { Authorization: token } }
        );
        isDirtyRef.current = false;
        setUpdatedByName(response.data.page.updated_by?.name ?? currentUser?.name ?? "");
        setSaveStatus("saved");
      } catch (error) {
        console.error(
          "Page save failed:",
          error instanceof Error ? error.message : "Unknown error",
        );
        setSaveStatus("error");
      }
    }, 800);
  }

  function handleTitleChange(value: string) {
    isDirtyRef.current = true;
    setTitle(value);
    scheduleSave(value);
  }

  function handleAddToNote(content: string) {
    if (!editor) return;
    const html = markdownToTiptapHTML(content);
    editor.chain().focus().insertContentAt(editor.state.doc.content.size, html).run();
    setAiAdded(true);
    scheduleSave(title);
  }

  function insertPageLink(page: { id: number; title: string }) {
    editor?.chain().focus().insertContent({
      type: "pageLink",
      attrs: { pageId: page.id, title: page.title },
    }).run();
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
      setWorkspaceId(page.workspace_id);
      setCreatedByName(page.created_by?.name ?? "");
      setUpdatedByName(page.updated_by?.name ?? page.created_by?.name ?? "");

      editor?.commands.setContent(page.content ?? "");

      const workspacePagesRes = await api.get(`/pages?workspaceId=${page.workspace_id}`, {
        headers: { Authorization: token },
      });
      setPages(workspacePagesRes.data.pages);

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
        setRemoteUpdate(update);
        return;
      }

      setTitle(update.title);
      setUpdatedByName(update.updatedBy?.name ?? "");
      editor.commands.setContent(update.content ?? "", { emitUpdate: false });
      setRemoteUpdate(null);
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
    setUpdatedByName(remoteUpdate.updatedBy?.name ?? "");
    editor.commands.setContent(remoteUpdate.content ?? "", { emitUpdate: false });
    isDirtyRef.current = false;
    setRemoteUpdate(null);
  }

  if (!editor || !loaded) return null;

 return (
  <div className="min-h-screen bg-[#FAF8F3] px-10 py-6 pb-28">
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-black/5 text-sm text-[#1B1E2A]/80 shadow-sm hover:bg-black/[0.02] transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <span className="text-sm text-[#1B1E2A]/40 font-mono tracking-tight">
          Notes / <span className="text-[#1B1E2A]/60">{title || "Untitled"}</span>
        </span>
      </div>

      <div className="flex items-center gap-4">
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

    <div className="flex items-start gap-6 px-5">
      <div className="flex-1 min-w-0 pr-40">
        <div className="flex items-center gap-3 mb-2">
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="font-serif text-[42px] leading-tight font-semibold text-[#1B1E2A] flex-1 min-w-0 bg-transparent outline-none placeholder:text-[#1B1E2A]/25"
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
            <button
              type="button"
              onClick={loadRemoteUpdate}
              className="rounded-full bg-[#F5D9A0] px-2 py-0.5 text-xs text-[#1B1E2A] hover:bg-[#EBC779]"
            >
              Load latest from {remoteUpdate.updatedBy?.name ?? "a collaborator"}
            </button>
          )}
          {aiAdded && (
            <span className="text-xs font-medium text-[#8A5A16] bg-[#F5D9A0] px-2 py-0.5 rounded-full">
              AI-added
            </span>
          )}
        </div>

        <div className="h-px bg-black/[0.06] mb-6" />

        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm px-8 py-6">
          <EditorContent
            editor={editor}
            className="prose prose-neutral max-w-none focus:outline-none min-h-[300px]"
          />
        </div>
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

    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#1B1E2A] rounded-full px-2 py-2 shadow-xl z-50">
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

      <div className="relative">
        <button
          onClick={() => setLinkOpen((o) => !o)}
          className="px-3 py-1.5 rounded-full text-sm text-white/80 hover:bg-white/10"
        >
          <Link2 size={14} />
        </button>

        {linkOpen && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 bg-white rounded-xl border border-black/10 shadow-xl p-2">
            <input
              autoFocus
              value={linkQuery}
              onChange={(e) => setLinkQuery(e.target.value)}
              placeholder="Search or create a page…"
              className="w-full px-2 py-1.5 text-sm border border-black/10 rounded-md outline-none mb-2"
            />
            <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5">
              {pages
                .filter((p) => p.title.toLowerCase().includes(linkQuery.toLowerCase()))
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => insertPageLink(p)}
                    className="text-left px-2 py-1.5 text-sm rounded-md hover:bg-black/5"
                  >
                    {p.title}
                  </button>
                ))}

              {linkQuery.trim() && !pages.some(
                (p) => p.title.toLowerCase() === linkQuery.trim().toLowerCase()
              ) && (
                <button
                  onClick={() => createAndLinkPage(linkQuery.trim())}
                  className="text-left px-2 py-1.5 text-sm rounded-md text-[#443F76] hover:bg-black/5"
                >
                  + Create "{linkQuery.trim()}"
                </button>
              )}
            </div>
          </div>
        )}
      </div>


    </div>
  </div>
);
}