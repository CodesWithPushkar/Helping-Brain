import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useDashboard, type WorkspaceOption } from "../hooks/ContextApi/DashboardContex";

type WorkspaceDropdownProps = {
  options: WorkspaceOption[];
  selected: WorkspaceOption | null;
  onSelect: (option: WorkspaceOption) => void;
};

export default function Dropdown({ options, selected, onSelect }: WorkspaceDropdownProps){
  const { setPages } = useDashboard();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!selected) return null; 

  return (
    
    <div className="relative inline-block font-sans rounded-lg bg-[#22213c]" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center p-3 gap-3 rounded-lg hover:bg-white/5 transition-colors text-left"
      >
        <div 
          className="flex items-center justify-center w-11 h-11 rounded-[10px] shrink-0 shadow-sm"
          style={{ backgroundColor: selected.iconColor }}
        >
          <span className="text-[#13142b] font-serif font-bold text-[17px] tracking-wide">
            {selected.initials}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-white text-[16px] font-semibold tracking-wide leading-tight">
            {selected.title}
          </h2>
          <p className="text-[#8689a7] text-[13px] font-medium mt-[2px]">
            {selected.count} workspaces
          </p>
        </div>
        <ChevronDown className="w-5 h-5 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-20 w-full mt-2 rounded-lg bg-[#2a2947] shadow-xl border border-[#3b395e] overflow-hidden">
          <ul className="py-1">
            {options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className="flex w-full items-center px-4 py-2 gap-3 hover:bg-[#3b395e] transition-colors text-left"
                  onClick={() => {
                    onSelect(option);
                    setPages(option.pages);
                    setIsOpen(false);
                  }}
                >
                  <div 
                    className="flex items-center justify-center w-8 h-8 rounded-md shrink-0"
                    style={{ backgroundColor: option.iconColor }}
                  >
                    <span className="text-[#13142b] font-serif font-bold text-xs">{option.initials}</span>
                  </div>
                  <span className="text-white text-[14px] font-medium flex-1">{option.title}</span>
                </button>
              </li>
            ))}
          </ul>
        
        </div>
      )}
    </div>
  );
}