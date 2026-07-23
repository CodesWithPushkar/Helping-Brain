import api from "./axios"

export const getUser = async () => {
  const token = localStorage.getItem('token');
  const response = await api.get('/user', {
    headers: {
      Authorization: token
    }
  });

  return response.data;
}