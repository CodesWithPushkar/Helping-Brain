import { useState, useEffect, useCallback } from "react";
import { getWorkspaces } from "../../api/workspaces";
import { type WorkspaceOption } from "../ContextApi/DashboardContex";

export const workspacePalette = ["#d99939", "#5ca4a9", "#e67e88", "#8b5cf6", "#22c55e"];

export const getInitials = (name: string) => {
  const initials = name
          .split(" ")
          .slice(0, 2)
          .map((word: string) => word[0])
          .join("")
          .toUpperCase();
  return initials;
}

export const useWorkspace = () => {
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [loding, setLoding] = useState(true);
  const [error, setError] = useState("");

  const fetchWorkspace = useCallback(async () => {
    try {
      const response = await getWorkspaces();
      
      const backendWorkspaces = response.workspaces;

      const formattedWorkspaces = backendWorkspaces.map((ws, index) => {
        const initials = getInitials(ws.name);

        return {
          id: ws.id.toString(),
          initials: initials,
          title: ws.name,
          pages: ws.pages.map((page) => ({
            ...page,
            id: page.id.toString(),
            created_at: new Date(page.created_at),
            updated_at: new Date(page.updated_at),
          })),
          count: ws.pages.length,
          iconColor: workspacePalette[index % workspacePalette.length],
          isOwner: ws.isOwner,
          ownerName: ws.owner.name,
        };
      });

      setWorkspaces(formattedWorkspaces);
      setError("");
    } catch (err) {
      console.error(
        "Workspace fetch failed:",
        err instanceof Error ? err.message : "Unknown error",
      );
      setError(() => "Unable to load workspace");
    } finally {
      setLoding(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  return {
    workspaces,
    setWorkspaces,
    loding,
    error,
    fetchWorkspace,
  };
};