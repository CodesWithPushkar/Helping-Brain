import { type LucideIcon } from "lucide-react";
import { cn } from "../utils";
import { useNavigate } from "react-router-dom";

export type FolderComponentProps = {
  id: string;
  icon: LucideIcon;
  name: string;
  color?: string
  className?: string;
  childCount?: number;
}

const FolderComponent = ({id, name, icon: Icon, childCount, color, className}: FolderComponentProps) => {
  const navigate = useNavigate();
  return <button
    type="button"
    onClick={() => navigate(`/notes/${id}`)}
    className={cn("h-full w-full min-w-0 text-left", className)}
  >
    <div className="flex h-full min-h-[72px] min-w-0 items-center gap-3 rounded-[15px] border border-line bg-white p-3 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md sm:gap-[15px] sm:p-4">
      <div className="flex shrink-0 items-center justify-center">
        <div
          style={{ backgroundColor: color }}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm sm:h-12 sm:w-12"
        >
          <Icon size={22} strokeWidth={2.25} />
        </div>
      </div>
      
      
      <div className="flex min-w-0 flex-col justify-center">
        <h5 className="line-clamp-1 font-sans text-[14.5px] font-semibold leading-[1.35] text-ink">{name}</h5>
        <span className="flex-1 line-clamp-2 font-sans text-[12.8px] font-normal leading-[1.55] text-ink-soft">{childCount} notes</span>
      </div>
      

    </div>
  </button>
}

export default FolderComponent