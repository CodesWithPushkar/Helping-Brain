import ButtonComponent from "./ButtonComponent";
import { Bell, Sparkle } from "lucide-react";

type NavProps = {
  workspaceName: string;
}

const Nav = ({workspaceName}:NavProps) => {
  return <div className="flex justify-between h-9 mb-7">
    <span className="font-mono flex gap-2 text-[15px]">
      <span className="font-semibold">{workspaceName}</span> 
      <span className="text-[#57536e]">{"/ All notes"}</span>
    </span>
    <div className="flex gap-4">
      <ButtonComponent icon={Bell} className="bg-white hover:bg-white" iconColor="black"/>
      <ButtonComponent title="Ask AI" icon={Sparkle} iconColor="yellow"/>
    </div>
  </div>
}

export default Nav;