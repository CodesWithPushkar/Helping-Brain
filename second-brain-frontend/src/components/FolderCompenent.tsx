import { type LucideIcon } from "lucide-react";
import { cn } from "../utils";

export type FolderComponentProps = {
  icon: LucideIcon;
  name: string;
  color: string
  className?: string;
  childCount: number;
}

const FolderComponent = ({name, icon: Icon, childCount, color, className}: FolderComponentProps) => {
  return <>
    <div className="w-64 flex gap-[15px] p-4 m-2px items-center border border-line cursor-pointer rounded-[15px] bg-white transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md">
      <div className={"flex items-center justify-center"}>
        <div style={{backgroundColor: color}} className={cn(`flex h-[40px] w-[40px] items-center justify-center rounded-[7px] text-white`, className)}>
          <Icon/>
        </div>
      </div>
      
      
      <div className="flex flex-col justify-center">
        <h5 className="line-clamp-1 font-sans text-[14.5px] font-semibold leading-[1.35] text-ink">{name}</h5>
        <span className="flex-1 line-clamp-2 font-sans text-[12.8px] font-normal leading-[1.55] text-ink-soft">{childCount} notes</span>
      </div>
      

    </div>
  </>
}

export default FolderComponent