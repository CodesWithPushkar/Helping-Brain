import api from "./axios"; 

type WorkspacePageResponse = {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  icon: string;
  color: string;
  parent_page_id: number | null;
  workspace_id: number;
  _count: { children: number };
};

type WorkspaceResponse = {
  id: number;
  name: string;
  isOwner: boolean;
  owner: { name: string };
  pages: WorkspacePageResponse[];
};

type GetWorkspacesResponse = { workspaces: WorkspaceResponse[] };

export const getWorkspaces = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get<GetWorkspacesResponse>("/workspace", {
    headers: {
      Authorization: token 
    }
  });

  return response.data;
};