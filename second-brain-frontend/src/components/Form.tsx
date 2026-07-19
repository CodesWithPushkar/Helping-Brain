import { useState } from "react";
import {
  Folder,
  BookOpen,
  Brain,
  Code2,
  Database,
  FlaskConical,
  Rocket,
  Star,
  Lightbulb,
  Layers,
  Target,
  Palette,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// 1. The icon picker only needs to show a small curated set, not all ~1500
//    lucide icons. Keep the component -> name map in one place so the
//    "value" you store/send is always just the string key (e.g. "Brain"),
//    never the component itself.
// ---------------------------------------------------------------------------
export const ICONS = {
  Folder,
  BookOpen,
  Brain,
  Code2,
  Database,
  FlaskConical,
  Rocket,
  Star,
  Lightbulb,
  Layers,
  Target,
  Palette,
} as const;

export type FolderIconName = keyof typeof ICONS;

// A small palette that matches the Helping Brain design tokens.
// Swap these hexes for whatever your theme uses.
const COLORS = [
  { name: "Brass", value: "#D8A34D" },
  { name: "Teal", value: "#3F8F82" },
  { name: "Clay", value: "#B4553F" },
  { name: "Ink", value: "#14192B" },
  { name: "Plum", value: "#7A5C8E" },
  { name: "Moss", value: "#5E7A4F" },
] as const;

export interface NewFolderPayload {
  title: string;
  workspaceId: number;
  icon: FolderIconName;
  parentPageId: number | null;
  color: string;
}

interface NewFolderModalProps {
  isOpen: boolean;
  /** The workspace this page belongs to. See note at the bottom of this
   *  file for the three common ways to get this value from a parent. */
  workspaceId: number;

  onClose: () => void;
  onCreate: (page: NewFolderPayload) => void;
}

/**
 * Renders a "Create folder" form (name + icon + color), scoped to a single
 * workspace. Only the icon's *name* (e.g. "Brain") is ever passed upward —
 * the consuming component is responsible for looking that name back up in
 * ICONS (or its own copy of it) when it wants to actually render the icon.
 */
export default function NewFolderModal({
  isOpen,
  workspaceId,
  onClose,
  onCreate,
}: NewFolderModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<FolderIconName>("Folder");
  const [color, setColor] = useState<string>(COLORS[0].value);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Give the folder a name to continue.");
      return;
    }
    onCreate({ title: trimmed, workspaceId, parentPageId: null, icon, color });
    setName("");
    setIcon("Folder");
    setColor(COLORS[0].value);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#14192B]/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#F7F5EE] border border-black/10 shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="font-semibold text-[#1B1E2A] text-lg">New folder</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-[#6B6E7C] hover:text-[#1B1E2A] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="px-5 pb-5 flex flex-col gap-5">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="folder-name" className="text-xs font-semibold text-[#1B1E2A]">
                Name
              </label>
              <input
                id="folder-name"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Machine Learning"
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-[#1B1E2A] outline-none focus:border-[#3F8F82]"
              />
              {error && <span className="text-xs text-[#B4553F]">{error}</span>}
            </div>

            {/* Icon picker */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#1B1E2A]">Icon</span>
              <div className="grid grid-cols-6 gap-2">
                {(Object.keys(ICONS) as FolderIconName[]).map((iconName) => {
                  const IconComponent = ICONS[iconName];
                  const selected = icon === iconName;
                  return (
                    <button
                      type="button"
                      key={iconName}
                      onClick={() => setIcon(iconName)}
                      aria-label={iconName}
                      aria-pressed={selected}
                      className={`flex items-center justify-center rounded-lg border py-2 transition-colors ${
                        selected
                          ? "border-[#3F8F82] bg-[#DCEBE8]"
                          : "border-black/10 bg-white hover:border-black/20"
                      }`}
                    >
                      <IconComponent
                        size={16}
                        color={selected ? "#357369" : "#1B1E2A"}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

         
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-[#1B1E2A]">Color</span>
              <div className="flex gap-2">
                {COLORS.map((c) => {
                  const selected = color === c.value;
                  return (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      aria-label={c.name}
                      aria-pressed={selected}
                      className="h-7 w-7 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: c.value,
                        boxShadow: selected ? "0 0 0 2px #F7F5EE, 0 0 0 4px #1B1E2A" : "none",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-black/10 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-[#6B6E7C] hover:text-[#1B1E2A]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#14192B] px-4 py-2 text-sm font-semibold text-[#F7F5EE] hover:bg-[#1E2540]"
            >
              Create folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
