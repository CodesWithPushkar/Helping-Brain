import { Search } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import Dropdown from "../components/Dropdown";
import SearchComponent from "../components/SearchComponent";
import SideBarFolderComponent from "../components/SideBarFolderComponent";
import AddButton from "../components/AddButton";
import { useDashboard } from "../hooks/ContextApi/DashboardContex";
import ProfileCard from "../components/ProfileCard";
import { useNavigate } from "react-router-dom";
import NewWorkspaceForm from "../components/WorkspaceForm";
import api from "../api/axios";
import { getInitials, workspacePalette } from "../hooks/useEffect/useWorkspace";

const Sidebar = () => {
  const [addWorkshop, setAddWorkshop] = useState<boolean>(false);
  const navigate = useNavigate();
  const { 
    sidebarWidth, 
    isResizing, 
    setIsResizing, 
    workspaces, 
    setWorkspaces,
    loding, 
    selectedWorkspace, 
    setSelectedWorkspace,
    setPages, 
    setOpen
  } = useDashboard();

  const startResizing = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (workspaces?.length > 0 && !selectedWorkspace) {
      setSelectedWorkspace(workspaces[0]);
      setPages(workspaces[0].pages);
    }
  }, [workspaces, selectedWorkspace, setSelectedWorkspace]);

  return (
    <>
      <div className="flex flex-col justify-between bg-sidebar overflow-hidden shrink-0 px-4 py-5 h-screen">
    
        <div 
          className="flex flex-col" 
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="px-2 pb-4 pt-1 flex items-center justify-center">
            <h2 className="font-semibold text-white font-serif text-[17px]">Helping Brain</h2>
          </div>
          
          {loding ? (
            <div className="h-12 w-full bg-white/10 animate-pulse rounded-lg my-2"></div>
          ) : (
            <Dropdown 
              options={workspaces} 
              selected={selectedWorkspace}
              onSelect={setSelectedWorkspace}
              onClickAdd={() => {
                setAddWorkshop(true);
              }}
            />
          )}
          
          <SearchComponent icon={Search} placeholder="Search notes" bgColor="bg-[#22213c]" iconColor="text-white" className="my-4"/>

          {loding ? (
            <div className="flex flex-col gap-4 animate-pulse mt-2 mb-4">
              <div className="h-6 bg-white/10 rounded-md w-full"></div>
              <div className="h-6 bg-white/10 rounded-md w-5/6"></div>
              <div className="h-6 bg-white/10 rounded-md w-4/6"></div>
              <div className="h-6 bg-white/10 rounded-md w-full"></div>
            </div>
          ) : (
            <SideBarFolderComponent />
          )}
          
          <AddButton title="+ New Notes" className="mt-3" onClick={() => setOpen(true)} />

            
        </div>

        <div>
          <ProfileCard
            name="Riya Sharma"
            email="riya@gmail.com"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/signin");
            }}
          />
        </div>

      </div>

      <div
        onMouseDown={startResizing}
        className={`w-1 cursor-col-resize transition-colors hover:bg-blue-400 ${
          isResizing ? "bg-blue-500" : "bg-zinc-200"
        }`}
      />

      {<NewWorkspaceForm isOpen={addWorkshop} onClose={() => setAddWorkshop(false)} onCreate={async(data) => {
        const token = localStorage.getItem('token');
        const res = await api.post("/create/workspace", data, {
          headers: {
            Authorization: token
          }          
        });
        const newWorkspace = res.data.workspace; 



        setWorkspaces(prev => [...prev, {
          id: newWorkspace.id.toString(),
          title: newWorkspace.name,
          initials: getInitials(newWorkspace.name),
          pages: newWorkspace.pages ?? [],     
          count: newWorkspace.pages?.length ?? 0,
          iconColor: workspacePalette[prev.length % workspacePalette.length],

        }]);

        
        setAddWorkshop(false);
      }}/>}
    </>
  );
}

export default Sidebar;