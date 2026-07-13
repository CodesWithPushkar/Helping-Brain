import { createContext, useContext, useState, type ReactNode } from "react";

export type FolderOption = {
  id: string;
  initials: string;
  title: string;
  count: number;
  iconColor: string;
};


type DashboardContextType = {
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  isResizing: boolean;
  setIsResizing: (isResizing: boolean) => void;
  workspaces: FolderOption[];
  selectedFolder: FolderOption | null;
  setSelectedFolder: (folder: FolderOption) => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [sidebarWidth, setSidebarWidth] = useState<number>(260);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderOption | null>(null);

  const workspaces: FolderOption[] = [
    { id: "1", initials: "PD", title: "Product Design", count: 3, iconColor: "#d99939" },
    { id: "2", initials: "EN", title: "Engineering", count: 5, iconColor: "#5ca4a9" },
    { id: "3", initials: "MK", title: "Marketing", count: 1, iconColor: "#e67e88" },
  ];

  return (
    <DashboardContext.Provider value={{
      sidebarWidth, setSidebarWidth,
      isResizing, setIsResizing,
      workspaces, selectedFolder, setSelectedFolder
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};