import { createContext, useContext, useState, type ReactNode } from "react";
import { useWorkspace } from "../useEffect/useWorkspace";

export type PageOption = {
  id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  icon: string;
  color: string;
  parent_page_id: number | null;
  workspace_id: number;
  _count: {
    children: number;
  };
};

export type WorkspaceOption = {
  id: string;
  initials: string;
  title: string;
  count: number;
  pages: PageOption[];
  iconColor: string;
};

type DashboardContextType = {
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  isResizing: boolean;
  setIsResizing: (isResizing: boolean) => void;
  workspaces: WorkspaceOption[];
  setWorkspaces: React.Dispatch<React.SetStateAction<WorkspaceOption[]>>;
  selectedWorkspace: WorkspaceOption | null;
  setSelectedWorkspace: (workspace: WorkspaceOption) => void;
  pages: PageOption[];
  setPages: React.Dispatch<React.SetStateAction<PageOption[]>>;
  selectedPage: PageOption | null;
  setSelectedPage: (page: PageOption) => void;
  open: boolean,
  setOpen: (open: boolean) => void
  loding: boolean;
  fetchWorkspace: () => void;
  error: string | null;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [sidebarWidth, setSidebarWidth] = useState<number>(260);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceOption | null>(null);

  const [pages, setPages] = useState<PageOption[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageOption | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const { workspaces, setWorkspaces, loding, error, fetchWorkspace } = useWorkspace();

  return (
    <DashboardContext.Provider
      value={{
        sidebarWidth,
        setSidebarWidth,
        isResizing,
        setIsResizing,
        workspaces,
        setWorkspaces,
        selectedWorkspace,
        setSelectedWorkspace,
        pages,
        setPages,
        selectedPage,
        setSelectedPage,
        open,
        setOpen,
        loding,
        fetchWorkspace,
        error
      }}
    >
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