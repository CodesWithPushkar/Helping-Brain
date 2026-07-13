import { Search } from "lucide-react";
import { type MouseEvent } from "react";
import Dropdown from "../components/Dropdown";
import SearchComponent from "../components/SearchComponent";
import SideBarFolderComponent from "../components/SideBarFolderComponent";
import AddButton from "../components/AddButton";
import { useDashboard } from "../hooks/ContextApi/DashboardContex";

const Sidebar = () => {
  const { sidebarWidth, isResizing, setIsResizing, workspaces } = useDashboard();

  const startResizing = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <>
      <div 
        className="bg-sidebar overflow-hidden shrink-0 px-4 py-5 flex flex-col" 
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="px-2 pb-4 pt-1 flex items-center justify-center">
          <h2 className="font-semibold text-white font-serif text-[17px]">Helping Brain</h2>
        </div>
        
        {/* Dropdown can still take props to remain a generic reusable component */}
        <Dropdown options={workspaces} />
        
        <SearchComponent icon={Search} placeholder="Search notes" bgColor="bg-[#22213c]" iconColor="text-white" className="my-4"/>

        <SideBarFolderComponent />
        
        <AddButton title="+ New Folder" className="mt-3"/>
      </div>

      <div
        onMouseDown={startResizing}
        className={`w-1 cursor-col-resize transition-colors hover:bg-blue-400 ${
          isResizing ? "bg-blue-500" : "bg-zinc-200"
        }`}
      />
    </>
  );
}

export default Sidebar;