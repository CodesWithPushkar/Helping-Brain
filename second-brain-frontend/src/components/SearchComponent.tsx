import { type LucideIcon, Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "../utils";
import api from "../api/axios";
import { useDashboard } from "../hooks/ContextApi/DashboardContex";
import { ICONS, type FolderIconName } from "./Form";
import FolderComponent from "./FolderCompenent";

type SearchProps = {
  placeholder?: string;
  icon?: LucideIcon;
  rightElement?: ReactNode;
  iconColor?: string;
  bgColor?: string;
  placeholderTextColor?: string;
  className?: string;
  onChange?: (query: string) => void;
};

interface Note {
  id: number;
  title: string;
  icon: string;
  color: string;
  workspace_id: number;
  parent_page_id: number | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

const SearchComponent = ({
  placeholder,
  icon: Icon,
  rightElement,
  iconColor = "text-black",
  bgColor = "bg-white",
  placeholderTextColor = "text-ink-soft",
  className = "",
}: SearchProps) => {
  const [search, setSearch] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { selectedWorkspace } = useDashboard();
  const isWorkspaceLocked = !selectedWorkspace;

  useEffect(() => {
    if (!search.trim() || !selectedWorkspace?.id) {
      setNotes([]);
      return;
    }

    const fetchSearchNotes = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await api.get(`/notes/search?q=${search}&workspaceId=${selectedWorkspace.id}`, {
          headers: {
            Authorization: token
          }
        });
        console.log(response.status)
        setNotes(response.data);
      } catch (error) {
        console.error("Error fetching notes:", error);
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSearchNotes();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedWorkspace?.id]);

  return (
    <div className="relative w-full">
      <div
        className={cn(
          `flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 ${bgColor} border-none`,
          className,
          isWorkspaceLocked && "opacity-70"
        )}
      >
        {Icon && <Icon size={18} className="shrink-0" color={iconColor} />}

        <input
          className={`flex-1 bg-transparent outline-none placeholder:font-sans placeholder:text-[14px] placeholder:${placeholderTextColor} placeholder:font-normal ${iconColor}`}
          placeholder={isWorkspaceLocked ? "Create a workspace to start searching" : placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={isWorkspaceLocked}
        />

        {rightElement}
      </div>

      {!isWorkspaceLocked && search.trim() && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center p-4 text-slate-500">
              <Loader2 size={18} className="mr-2 animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          ) : notes.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto">
              {notes.map((note) => (
                  <FolderComponent id={note.id.toString()} name={note.title} icon={ICONS[note.icon as FolderIconName] ?? ICONS.Folder} color={note.color}/>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">
              No notes found for "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;