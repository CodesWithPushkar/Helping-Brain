import { type MouseEvent } from "react";
import Sidebar from "../layout/Sidebar";
import { DashboardProvider, useDashboard } from "../hooks/ContextApi/DashboardContex";
import Main from "../layout/Main";

const DashboardContent = () => {
  const { isResizing, setIsResizing, setSidebarWidth } = useDashboard();

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
      className="flex h-screen w-screen bg-white"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} 
    >

      <Sidebar />

      <Main username="Pushkar" totalFolderCount={3}/>
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