import { useState, useRef, useEffect } from "react";

export type WorkspaceOption = {
  id: string;
  initials: string;
  title: string;
  count: number;
  iconColor: string;
};

type WorkspaceDropdownProps = {
  options: WorkspaceOption[];
};

export default function Dropdown({ options }: WorkspaceDropdownProps){
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<WorkspaceOption>(options[0]);
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

  return (
    <div 
      className="relative inline-block font-sans rounded-lg bg-[#22213c]" 
      ref={dropdownRef}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center p-3 gap-3 rounded-lg hover:bg-white/5 transition-colors text-left focus:outline-none"
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


        <svg 
          className={`w-3 h-3 text-[#646781] transition-transform duration-200 mr-1 ${isOpen ? "rotate-180" : ""}`} 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M7 10l5 5 5-5z" />
        </svg>
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
                    setSelected(option);
                    setIsOpen(false);
                  }}
                >
                  <div 
                    className="flex items-center justify-center w-8 h-8 rounded-md shrink-0"
                    style={{ backgroundColor: option.iconColor }}
                  >
                    <span className="text-[#13142b] font-serif font-bold text-xs">
                      {option.initials}
                    </span>
                  </div>
                  
                  <span className="text-white text-[14px] font-medium flex-1">
                    {option.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}