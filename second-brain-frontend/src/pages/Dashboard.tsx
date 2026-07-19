import { type MouseEvent } from "react";
import Sidebar from "../layout/Sidebar";
import { DashboardProvider, useDashboard } from "../hooks/ContextApi/DashboardContex";
import Main from "../layout/Main";
import DashboardError from "./DashboardError";
import DashboardSkeleton from "./DashboardSkeleton";
import NewFolderModal from "../components/Form";
import api from "../api/axios";

const DashboardContent = () => {
  const { isResizing, setIsResizing, setSidebarWidth, loding, fetchWorkspace, error, selectedWorkspace, setPages, open, setOpen } = useDashboard();
  console.log("Current State:", { loding, error });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    const newWidth = Math.max(150, Math.min(e.clientX, 600));
    setSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    if (isResizing) setIsResizing(false);
  };

  return (
    <div 
      className="flex h-full w-full bg-sidebar"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} 
    >
      
      <Sidebar />

      {loding ? (
        <DashboardSkeleton />
      ) : error ? (
        <DashboardError message={error} onRetry={fetchWorkspace}/>
      ) : (
        <Main username="Pushkar" totalFolderCount={3} />
      )}



      {selectedWorkspace && (
              <NewFolderModal
                isOpen={open}
                workspaceId={Number(selectedWorkspace.id)}
                onClose={() => setOpen(false)}
                onCreate={async (page) => {
                  const token = localStorage.getItem("token");
                  const res = await api.post("/create/page", page, {
                    headers: {
                      Authorization: token
                    }
                  });
                  if(res.status==200){
                    console.log(res.data);
                    setPages(prev => [...prev, res.data.page])
                  }

                  setOpen(false);
                }}
              />
            )}
      
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}