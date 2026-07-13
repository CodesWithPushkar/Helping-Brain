import { useDashboard } from "../hooks/ContextApi/DashboardContex";
import MainNav from "../components/MainNav"
import SearchComponent from "../components/SearchComponent";
import { Sparkle } from "lucide-react";
import ButtonComponent from "../components/ButtonComponent";
import FolderComponent from "../components/FolderCompenent";
import { FolderOpen, Briefcase, BookHeart, GraduationCap, Plane } from "lucide-react";
import AddButton from "../components/AddButton";



// Inside your component mapping:
// <FolderComponent 
//    icon={iconMap[folder.icon]} 
//    name={folder.name} 
//    notesCount={folder.notesCount} 
//    color={folder.color} 
// />



const temp = [
  {
    "icon": "FolderOpen",
    "name": "Personal Projects",
    "notesCount": 12,
    "color": "#3b82f6"
  },
  {
    "icon": "Briefcase",
    "name": "Work Meetings",
    "notesCount": 34,
    "color": "#ef4444"
  },
  {
    "icon": "BookHeart",
    "name": "Journaling",
    "notesCount": 89,
    "color": "#ec4899"
  },
  {
    "icon": "Briefcase",
    "name": "Work Meetings",
    "notesCount": 34,
    "color": "#ef4444"
  },
  {
    "icon": "BookHeart",
    "name": "Journaling",
    "notesCount": 89,
    "color": "#ec4899"
  },
  
]

const iconMap: Record<string, any> = {
  FolderOpen,
  Briefcase,
  BookHeart,
  GraduationCap,
  Plane
};


type MainProps = {
  username: string;
  totalFolderCount: number;
}




const Main = ({username, totalFolderCount}: MainProps) => {
  const {selectedFolder} = useDashboard();
  return <div className="bg-paper-dim h-screen w-screen">
  <div className="flex flex-1 px-9 pt-7 pb-15 flex-col max-w-[1112px]">

      {/* {selectedFolder ? (
        <h1 className="text-2xl font-bold text-zinc-900">{selectedFolder.title}</h1>
      ) : (
        <h1 className="text-2xl font-bold text-zinc-900">Main Content</h1>
      )} */}
    <MainNav workspaceName="Product title"/>
    <span className="font-mono text-[#57536e] text-sm mb-1">Good afternoon, {username}</span>
    <h1 className="text-[32px] font-serif mb-2">Your second brain, organised.</h1>
    <span className="text-[14.5px] text-[#57536e]">
      <p>Pick up a note, browse a folder, or ask across everything you've written —</p>
      <p>Helping Brain remembers what you don't.</p>
    </span>
    
    <SearchComponent className="my-8 p-4" icon={Sparkle} iconColor="black" placeholder="Ask across every note in this workspace ..." rightElement={<ButtonComponent title="Ask" className="bg-black"/>} />

    <div className="flex justify-between">
        <h4 className="text-[15px] font-serif font-semibold tracking-wider mb-4">Folders</h4>
        <p className="text-[#57536e] font-mono text-[12.5px]">{totalFolderCount} total</p>
    </div>

    <div className="flex gap-4" >
      {
        temp.slice(0,3).map((p) => (
          <FolderComponent name={p.name} icon={iconMap[p.icon]} notesCount={p.notesCount} color={p.color} className={`bg-${p.color}`} />
        ))
      }

      <AddButton title="+ Add Button"/>
    </div>
    
    

    
    
      
  </div>
  </div>
}

export default Main;