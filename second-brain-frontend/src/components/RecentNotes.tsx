import { type LucideIcon } from "lucide-react";
import { cn } from "../utils";

type RecentNotesProps = {
  title: string;
  description: string;
  folder: string;
  updatedAt: string;
  icon: LucideIcon;
  className?: string;
  color: string;
};

const RecentNotesCard = ({
  title,
  description,
  folder,
  updatedAt,
  icon: Icon,
  className,
  color
}: RecentNotesProps) => {
  return (
    <div className="flex min-h-[150px] cursor-pointer flex-col gap-[10px] rounded-[14px] border border-line bg-white p-[18px] transition-all duration-150 hover:-translate-y-[2px] hover:border-[#D8D3C4]">
      
      <div className="flex items-center gap-[9px]">
        <div style={{backgroundColor: color}} className={cn(`flex h-[26px] w-[26px] items-center justify-center rounded-[7px] text-white`, className)}>
          <Icon size={14} />
        </div>

        <h4 className="line-clamp-1 font-sans text-[14.5px] font-semibold leading-[1.35] text-ink">
          {title}
        </h4>
      </div>

      <p className="flex-1 line-clamp-2 font-sans text-[12.8px] font-normal leading-[1.55] text-ink-soft">
        {description}
      </p>

      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] text-[#A7A38F]">
          {folder}
        </span>

        <span className="font-mono text-[11px] text-[#A7A38F]">
          •
        </span>

        <span className="font-mono text-[11px] text-[#A7A38F]">
          Edited {updatedAt}
        </span>
      </div>
    </div>
  );
};

export default RecentNotesCard;