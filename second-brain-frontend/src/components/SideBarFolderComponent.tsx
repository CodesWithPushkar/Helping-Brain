import { useDashboard } from "../hooks/ContextApi/DashboardContex";

type folderIconProps = {
  color: string;
}

const FolderIcon = ({ color }: folderIconProps) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>
  </svg>
);

const SideBarFolderComponent = () => {
  const { workspaces, selectedFolder, setSelectedFolder } = useDashboard();

  return (
    <div>
      <p className="text-[13.5px] font-semibold text-[#6E6A93] tracking-[0.1em] mb-3">Folders</p>
      <ul>
        {workspaces.map((option) => (
          <li key={option.id}>
            <button 
              className="flex w-full items-center px-4 py-2 gap-3 hover:bg-[#3b395e] hover:text-white transition-colors text-left rounded-md" 
              type="button" 
              onClick={() => setSelectedFolder(option)}
            >
              <div className="text-[#A29FC4] flex items-center gap-2 text-[15.3px] hover:text-white transition-colors">
                <span> 
                  <FolderIcon color={selectedFolder?.id === option.id ? '#FFD700' : '#A29FC4'} /> 
                </span>
                <p className="font-sans">{option.title}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SideBarFolderComponent;