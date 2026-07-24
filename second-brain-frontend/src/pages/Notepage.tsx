import { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import css from "highlight.js/lib/languages/css";
import js from "highlight.js/lib/languages/javascript";
import api from "../api/axios";
import "../editor.css";
import { useParams, useNavigate } from "react-router-dom";
import ButtonComponent from "../components/ButtonComponent";
import { Trash2, ArrowLeft, MoreVertical, Bold, Heading2, Code2 } from "lucide-react";

const lowlight = createLowlight();
lowlight.register("css", css);
lowlight.register("javascript", js);

export default function NotePage() {
  const { id } = useParams();
  const pageId = id ?? "";
  const [title, setTitle] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"" | "saved" | "saving">("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: "",
    onUpdate: () => {
      scheduleSave(title);
    },
  });

  function scheduleSave(currentTitle: string) {
    if (!loaded) return;
    setSaveStatus("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const token = localStorage.getItem("token");
      await api.patch(
        `/page/${pageId}`,
        { title: currentTitle, content: editor?.getJSON() },
        { headers: { Authorization: token } }
      );
      setSaveStatus("saved");
    }, 800);
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    scheduleSave(value);
  }

  useEffect(() => {
    async function loadPage() {
      const token = localStorage.getItem("token");
      const res = await api.get(`/page/${pageId}`, {
        headers: { Authorization: token },
      });

      const page = res.data.page;
      setTitle(page.title);

      if (editor && page.content) {
        editor.commands.setContent(page.content);
      }
      setLoaded(true);
    }

    if (editor) loadPage();
  }, [editor, pageId]);



  if (!editor || !loaded) return null;

  return (
    <div className="min-h-screen bg-[#FAF8F3] px-10 py-6">
      <div className="max-w-3xl mx-auto">
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
                  saveStatus === "saving" ? "bg-[#E2A63B]" : "bg-emerald-500"
                }`}
              />
              {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : ""}
            </div>
            <button className="p-1.5 rounded-full hover:bg-black/5 text-[#1B1E2A]/60 transition-colors">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled"
          className="font-serif text-[42px] leading-tight font-semibold text-[#1B1E2A] mb-2 w-full bg-transparent outline-none placeholder:text-[#1B1E2A]/25"
        />

        <div className="flex items-center gap-3 text-sm text-[#1B1E2A]/40 mb-6">
          <span>Notes</span>
          <span>Edited just now</span>
        </div>

        <div className="h-px bg-black/[0.06] mb-6" />

        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
              editor.isActive("bold")
                ? "bg-[#443F76] text-white border-[#443F76]"
                : "bg-white text-[#1B1E2A]/70 border-black/10 hover:bg-black/[0.03]"
            }`}
          >
            <Bold size={13} />
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
              editor.isActive("heading", { level: 2 })
                ? "bg-[#443F76] text-white border-[#443F76]"
                : "bg-white text-[#1B1E2A]/70 border-black/10 hover:bg-black/[0.03]"
            }`}
          >
            <Heading2 size={13} />
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
              editor.isActive("codeBlock")
                ? "bg-[#443F76] text-white border-[#443F76]"
                : "bg-white text-[#1B1E2A]/70 border-black/10 hover:bg-black/[0.03]"
            }`}
          >
            <Code2 size={13} />
            Code
          </button>

          <div className="flex-1" />

          <ButtonComponent
            icon={Trash2}
            className="!bg-[#1B1E2A] !rounded-full hover:!bg-black"
            onClick={async () => {
              const token = localStorage.getItem("token");
              await api.delete(`/page/${pageId}`, {
                headers: { Authorization: token },
              });
              navigate("/dashboard");
            }}
          />
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm px-8 py-6">
          <EditorContent
            editor={editor}
            className="prose prose-neutral max-w-none focus:outline-none min-h-[300px]"
          />
        </div>
      </div>
    </div>
  );
}