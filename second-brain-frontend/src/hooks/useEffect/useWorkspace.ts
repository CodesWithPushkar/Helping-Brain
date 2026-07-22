import { useState, useEffect } from "react";
import { getWorkspaces } from "../../api/workspaces";

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
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loding, setLoding] = useState(true);
  const [error, setError] = useState("");

  async function fetchWorkspace() {
    try {
      const response = await getWorkspaces();
      
      const backendWorkspaces = response.workspaces;

      const formattedWorkspaces = backendWorkspaces.map((ws: any, index: number) => {
        
        const initials = getInitials(ws.name);

        return {
          id: ws.id.toString(),
          initials: initials,
          title: ws.name,
          pages: ws.pages,     
          count: ws.pages.length,
          iconColor: workspacePalette[index % workspacePalette.length],
        };
      });

      setWorkspaces(formattedWorkspaces);
      setError("");
    } catch (err) {
      console.error("Workspace fetch failed:", err);
      setError(() => "Unable to load workspace");
    } finally {
      setLoding(false);
    }
  }

  useEffect(() => {
    fetchWorkspace();
  }, []);

  return {
    workspaces,
    setWorkspaces,
    loding,
    error,
    fetchWorkspace,
  };
};