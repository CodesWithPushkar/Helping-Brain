import { useEffect, useState } from "react";
import { getUser } from "../../api/user";

type userProp = {
    id: number;
    created_at: Date;
    updated_at: Date;
    name: string;
    email: string;
    picture_url: string;
}



export const userDetails = () => {
  const[user, setUser] = useState<userProp | undefined>(undefined);

  async function fetchUser(){
    const response = await getUser();
    setUser(response.user);
  }

  useEffect(() => {
    fetchUser();
  },[])

  return {
    user
  }
}