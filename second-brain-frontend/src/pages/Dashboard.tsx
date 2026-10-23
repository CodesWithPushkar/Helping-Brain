import { useEffect, type MouseEvent } from "react";
import Sidebar from "../layout/Sidebar";
import { DashboardProvider, useDashboard } from "../hooks/ContextApi/DashboardContex";
import Main from "../layout/Main";
import DashboardError from "./DashboardError";
import DashboardSkeleton from "./DashboardSkeleton";
import NewFolderModal from "../components/Form";
import api, { apiOrigin } from "../api/axios";
import { io } from "socket.io-client";

const DashboardContent = () => {
  const {
    isResizing,
    setIsResizing,
    setSidebarWidth,
    loding,
    fetchWorkspace,
    error,
    selectedWorkspace,
    setSelectedWorkspace,
    workspaces,
    setPages,
    open,
    setOpen,
  } = useDashboard();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(apiOrigin, { auth: { token } });
    socket.on("connect", () => {
      workspaces.forEach((workspace) => {
        socket.emit("workspace:join", { workspaceId: Number(workspace.id) });
      });
    });
    socket.on("workspace:changed", () => {
      void fetchWorkspace();
    });
    socket.on("connect_error", (socketError) => {
      console.error("Workspace live updates connection failed:", socketError);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchWorkspace, workspaces]);

  useEffect(() => {
    if (!selectedWorkspace) return;
    const refreshed = workspaces.find((workspace) => workspace.id === selectedWorkspace.id);
    if (refreshed && refreshed !== selectedWorkspace) {
      setSelectedWorkspace(refreshed);
      setPages(refreshed.pages);
    }
  }, [selectedWorkspace, setPages, setSelectedWorkspace, workspaces]);

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
      className="flex h-screen w-full bg-sidebar overflow-hidden"
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