import { useDashboard } from "../hooks/ContextApi/DashboardContex";
import { ICONS, type FolderIconName } from "./Form";
import { Folder as FolderIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

type SideBarFolderComponentProps = {
  onNavigate?: () => void;
};

const SideBarFolderComponent = ({ onNavigate }: SideBarFolderComponentProps) => {
  const { selectedPage, setSelectedPage, selectedWorkspace, pages } = useDashboard();
  const navigate = useNavigate();
  if(!selectedWorkspace) return null;
  return (
    <div>
      <p className="text-[13.5px] font-semibold text-[#6E6A93] tracking-[0.1em] mb-3">Notes</p>
      <ul>
        {pages.map((option) => {
          const IconComponent = ICONS[option.icon as FolderIconName] ?? FolderIcon;

          return (
          <li key={option.id}>
            <button 
              className="flex w-full items-center px-4 py-2 gap-3 hover:bg-[#3b395e] hover:text-white transition-colors text-left rounded-md" 
              type="button" 
              onClick={() => {
                setSelectedPage(option);
                navigate(`/notes/${option.id}`);
                onNavigate?.();
              }}
            >
              <div className="text-[#A29FC4] flex items-center gap-2 text-[15.3px] hover:text-white transition-colors">
                <span> 
                  <IconComponent color={selectedPage?.id === option.id ? '#FFD700' : '#A29FC4'} /> 
                </span>
                <p className="min-w-0 truncate font-sans">{option.title}</p>
              </div>
            </button>
          </li>
        )})}
      </ul>
    </div>
  );
}

export default SideBarFolderComponent;