import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
} from "lucide-react";
import api from "../api/axios";
import PageImageNode from "../extension/PageImageNode";

export type SolutionAuthor = { id: number; name: string };
export type SavedSolution = {
  id: number;
  content: string;
  created_at: string;
  created_by: SolutionAuthor;
  updated_at: string;
  updated_by: SolutionAuthor | null;
};

type SaveStatus = "saved" | "saving" | "error";

type RichSolutionEditorProps = {
  pageId: string;
  questionId: number;
  solution?: SavedSolution;
  onSaved: (solution: SavedSolution, created: boolean) => void;
  onFinish?: () => void;
};

function parseContent(content: string): JSONContent {
  try {
    const parsed: unknown = JSON.parse(content);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "type" in parsed &&
      parsed.type === "doc"
    ) {
      return parsed as JSONContent;
    }
  } catch {
    // Legacy solutions are plain text.
  }

  return {
    type: "doc",
    content: content
      ? content.split(/\r?\n/).map((text) => ({
          type: "paragraph",
          content: text ? [{ type: "text", text }] : [],
        }))
      : [{ type: "paragraph" }],
  };
}

function hasMeaningfulContent(content: JSONContent): boolean {
  if (content.type === "text" && content.text?.trim()) return true;
  if (content.type === "pageImage") return true;
  return content.content?.some(hasMeaningfulContent) ?? false;
}

export function RichSolutionContent({ content }: { content: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: true,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: "https",
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
        },
      }),
      PageImageNode,
    ],
    content: parseContent(content),
    editable: false,
    editorProps: { attributes: { class: "solution-content" } },
  });
  return <EditorContent editor={editor} className="solution-content" />;
}

export default function RichSolutionEditor({
  pageId,
  questionId,
  solution,
  onSaved,
  onFinish,
}: RichSolutionEditorProps) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [imageError, setImageError] = useState("");
  const solutionIdRef = useRef<number | null>(solution?.id ?? null);
  const timerRef = useRef<number | null>(null);
  const saveVersionRef = useRef(0);
  const savingRef = useRef(false);
  const latestContentRef = useRef<JSONContent | null>(null);
  const scheduleSaveRef = useRef<(content: JSONContent, delay?: number) => void>(() => {});
  const onSavedRef = useRef(onSaved);

  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  const persist = useCallback(async (content: JSONContent, version: number) => {
    if (savingRef.current) return;
    if (!solutionIdRef.current && !hasMeaningfulContent(content)) {
      setStatus("saved");
      return;
    }

    savingRef.current = true;
    const token = localStorage.getItem("token");
    try {
      const response = solutionIdRef.current
        ? await api.patch(
            `/page-solutions/${solutionIdRef.current}`,
            { content },
            { headers: { Authorization: token } },
          )
        : await api.post(
            `/page-questions/${questionId}/solutions`,
            { content },
            { headers: { Authorization: token } },
          );
      const saved = response.data.solution as SavedSolution;
      const created = solutionIdRef.current === null;
      solutionIdRef.current = saved.id;
      onSavedRef.current(saved, created);
      if (version === saveVersionRef.current) {
        setStatus("saved");
      } else if (latestContentRef.current) {
        scheduleSaveRef.current(latestContentRef.current, 0);
      }
    } catch (saveError) {
      console.error("Page solution autosave failed:", saveError);
      if (version !== saveVersionRef.current && latestContentRef.current) {
        scheduleSaveRef.current(latestContentRef.current, 0);
      } else {
        setStatus("error");
      }
    } finally {
      savingRef.current = false;
    }
  }, [questionId]);

  const scheduleSave = useCallback((content: JSONContent, delay = 700) => {
    latestContentRef.current = content;
    saveVersionRef.current += 1;
    setStatus("saving");
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    const version = saveVersionRef.current;
    timerRef.current = window.setTimeout(() => {
      void persist(content, version);
    }, delay);
  }, [persist]);
  useEffect(() => {
    scheduleSaveRef.current = scheduleSave;
  }, [scheduleSave]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: true,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: "https",
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
        },
      }),
      PageImageNode,
    ],
    content: solution ? parseContent(solution.content) : undefined,
    editorProps: {
      attributes: {
        class: "solution-editor",
        "aria-label": solution ? "Edit solution" : "Write a solution",
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items ?? []);
        const image = items.find((item) => item.type.startsWith("image/"));
        if (!image) return false;
        const file = image.getAsFile();
        if (file) void uploadImage(file);
        return true;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      scheduleSaveRef.current(currentEditor.getJSON());
    },
  }, [solution?.id]);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  async function uploadImage(file: File) {
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      setImageError("Choose a JPEG, PNG, GIF, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Images must be 5 MB or smaller.");
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
    } catch (uploadError) {
      console.error("Solution image upload failed:", uploadError);
      setImageError("Could not upload the image. Please try again.");
    }
  }

  function addLink() {
    const url = window.prompt("Enter a link URL");
    if (!url) return;
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function statusText() {
    if (status === "saving") return "Saving…";
    if (status === "error") return "Save failed — edit to retry";
    return "Saved";
  }

  if (!editor) return null;

  return (
    <div className="solution-editor-shell rounded-lg border border-[#E9E3D7] bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#EEE9E0] px-2 py-1.5">
        <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={15} /></ToolbarButton>
        <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={15} /></ToolbarButton>
        <ToolbarButton label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={15} /></ToolbarButton>
        <span className="mx-1 h-5 border-l border-[#E9E3D7]" />
        <ToolbarButton label="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={15} /></ToolbarButton>
        <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={15} /></ToolbarButton>
        <ToolbarButton label="Bulleted list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={15} /></ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={15} /></ToolbarButton>
        <ToolbarButton label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={15} /></ToolbarButton>
        <ToolbarButton label="Add link" active={editor.isActive("link")} onClick={addLink}><Link2 size={15} /></ToolbarButton>
        <label className="solution-toolbar-button" title="Add image">
          <ImagePlus size={15} />
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadImage(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <span className="ml-auto text-xs text-[#777383]" role="status">{statusText()}</span>
        {onFinish && (
          <button
            type="button"
            onClick={onFinish}
            className="ml-1 rounded-md px-2 py-1 text-xs font-medium text-[#443F76] hover:bg-[#F4F0E6]"
          >
            Done
          </button>
        )}
      </div>
      <EditorContent editor={editor} className="solution-editor" />
      {imageError && <p role="alert" className="px-3 pb-2 text-xs text-red-700">{imageError}</p>}
    </div>
  );
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={`solution-toolbar-button ${active ? "is-active" : ""}`}
    >
      {children}
    </button>
  );
}
