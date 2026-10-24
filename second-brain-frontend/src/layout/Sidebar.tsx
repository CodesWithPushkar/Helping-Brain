import { Search, Share2, X } from "lucide-react";
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
import { userDetails } from "../hooks/useEffect/useUser";
import ShareWorkspaceModal from "../components/ShareWorkspaceModal";

type SidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

const Sidebar = ({ mobileOpen, onMobileClose }: SidebarProps) => {
  const [addWorkshop, setAddWorkshop] = useState<boolean>(false);
  const [shareWorkspace, setShareWorkspace] = useState(false);
  const user = userDetails().user;
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
  }, [workspaces, selectedWorkspace, setPages, setSelectedWorkspace]);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] max-w-[calc(100vw-3rem)] flex-col justify-between overflow-hidden bg-sidebar px-4 py-4 shadow-xl transition-transform duration-200 md:relative md:z-auto md:h-screen md:max-w-none md:shrink-0 md:translate-x-0 md:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ width: `${sidebarWidth}px` }}
        aria-label="Workspace sidebar"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
          <div className="flex items-center justify-between px-2 pb-4 pt-1">
            <h2 className="font-semibold text-white font-serif text-[17px]">Helping Brain</h2>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={onMobileClose}
              className="rounded-full p-2 text-white/80 hover:bg-white/10 md:hidden"
            >
              <X size={18} />
            </button>
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

          {selectedWorkspace?.isOwner && (
            <button
              type="button"
              onClick={() => setShareWorkspace(true)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Share2 size={15} />
              Share workspace
            </button>
          )}
          
          <SearchComponent icon={Search} placeholder="Search notes" bgColor="bg-[#22213c]" iconColor="text-white" className="my-4" />

          {loding ? (
            <div className="flex flex-col gap-4 animate-pulse mt-2 mb-4">
              <div className="h-6 bg-white/10 rounded-md w-full"></div>
              <div className="h-6 bg-white/10 rounded-md w-5/6"></div>
              <div className="h-6 bg-white/10 rounded-md w-4/6"></div>
              <div className="h-6 bg-white/10 rounded-md w-full"></div>
            </div>
          ) : (
            <SideBarFolderComponent onNavigate={onMobileClose} />
          )}
          
          <AddButton title="+ New Notes" className="mt-3" onClick={() => setOpen(true)} />

            
        </div>

        <div>
          <ProfileCard
            name={user?.name ?? ""}
            email={user?.email ?? ""}
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/signin");
            }}
          />
        </div>

      </aside>

      <div
        onMouseDown={startResizing}
        className={`hidden w-1 cursor-col-resize transition-colors hover:bg-blue-400 md:block ${
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
          isOwner: true,
          ownerName: user?.name ?? "",

        }]);

        
        setAddWorkshop(false);
      }}/>}
      {selectedWorkspace && (
        <ShareWorkspaceModal
          key={selectedWorkspace.id}
          isOpen={shareWorkspace}
          workspaceId={Number(selectedWorkspace.id)}
          workspaceName={selectedWorkspace.title}
          onClose={() => setShareWorkspace(false)}
        />
      )}
    </>
  );
}

export default Sidebar;