import api from "./axios"; 

export const getWorkspaces = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get("/workspace", {
    headers: {
      Authorization: token 
    }
  });

  return response.data;
};