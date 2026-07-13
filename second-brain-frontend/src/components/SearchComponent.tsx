import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "../utils";


type SearchProps = {
  placeholder?: string;
  icon?: LucideIcon;
  rightElement?: ReactNode;
  iconColor?: string;
  bgColor?: string;
  placeholderTextColor?: string;
  className?: string;
};


const SearchComponent = ({
  placeholder,
  icon: Icon,
  rightElement,
  iconColor="text-black",
  bgColor="bg-white",
  placeholderTextColor="text-ink-soft",
  className=""
}: SearchProps) => {
  return (
    <div className={cn(`flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 ${bgColor} border-none`, className)}>
      {Icon && <Icon size={18} className={`shrink-0`} color={iconColor}/>}

      <input
        className={`flex-1 bg-transparent outline-none placeholder:font-sans placeholder:text-[14px] placeholder:${placeholderTextColor} placeholder:font-normal ${iconColor}`}
        placeholder={placeholder}
      />

      {rightElement}
    </div>
  );
};

export default SearchComponent;