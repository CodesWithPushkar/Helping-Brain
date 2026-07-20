import { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import css from "highlight.js/lib/languages/css";
import js from "highlight.js/lib/languages/javascript";
import api from "../api/axios";
import "../editor.css";
import { useParams } from "react-router-dom";

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CodeBlockLowlight.configure({ lowlight }),
      
    ],
    content: "",
    onUpdate: () => {
      scheduleSave();
    }
  });

  function scheduleSave() {
    setSaveStatus("saving");
    if(debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const token = localStorage.getItem("token");
      await api.patch(`/page/${pageId}`, { title, content: editor?.getJSON() },
        { headers: { Authorization: token } }
      );
      setSaveStatus("saved");
    }, 800);
    setSaveStatus("")
  }

  function handleTitleChange(value: string) {
    setTitle(value);
    scheduleSave();
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
    <div className="min-h-screen bg-[#F4F0E6] px-8 py-6">
      <div className="max-w-2xl mx-auto">
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="font-serif text-[38px] font-semibold text-[#1B1E2A] mb-2 w-full bg-transparent outline-none"
        />

        <div className="flex gap-2 mb-4">
          <button onClick={() => editor.chain().focus().toggleBold().run()}>Bold</button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
          <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code</button>
        </div>

        <EditorContent editor={editor} />
        <span>{saveStatus}</span>
      </div>
    </div>
  );
}