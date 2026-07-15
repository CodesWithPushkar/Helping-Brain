import MainNav from "../components/MainNav"
import SearchComponent from "../components/SearchComponent";
import { Sparkle } from "lucide-react";
import ButtonComponent from "../components/ButtonComponent";
import FolderComponent from "../components/FolderCompenent";
import { FolderOpen, Briefcase, BookHeart, GraduationCap, Plane } from "lucide-react";
import AddButton from "../components/AddButton";
import RecentNotesCard from "../components/RecentNotes";


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


const recentNotes = [
  {
    title: "React Authentication Flow",
    description:
      "Implemented JWT authentication with protected routes and refresh token handling.",
    folder: "Personal Projects",
    updatedAt: "2 hours ago",
    icon: "FolderOpen",
    color: "#3b82f6",
  },
  {
    title: "Sprint Planning Notes",
    description:
      "Discussed upcoming features, bug fixes, and task assignments for the next sprint.",
    folder: "Work Meetings",
    updatedAt: "Yesterday",
    icon: "Briefcase",
    color: "#ef4444",
  },
  {
    title: "Daily Reflection",
    description:
      "Wrote down lessons learned today and goals for tomorrow.",
    folder: "Journaling",
    updatedAt: "3 days ago",
    icon: "BookHeart",
    color: "#ec4899",
  },
  {
    title: "Operating Systems Revision",
    description:
      "Covered process scheduling algorithms and synchronization concepts.",
    folder: "College",
    updatedAt: "5 days ago",
    icon: "GraduationCap",
    color: "#22c55e",
  },
  {
    title: "Japan Trip Ideas",
    description:
      "Collected places to visit, estimated budget, and itinerary ideas.",
    folder: "Travel",
    updatedAt: "1 week ago",
    icon: "Plane",
    color: "#f59e0b",
  },
];

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
  return <div className="bg-paper-dim h-full w-full">
  <div className="flex flex-1 px-9 pt-7 pb-15 flex-col max-w-[1160px]">

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

    <div className="flex gap-4 w-full flex-wrap" >
      {
        temp.slice(0,3).map((p) => (
          <FolderComponent name={p.name} icon={iconMap[p.icon]} notesCount={p.notesCount} color={p.color} className={"flex-1"} />
        ))
      }

      <AddButton title="+ Add Button" className="w-[256px] bg-white border-none text-black hover:text-black"/>
    </div>



    <div className="flex justify-between mt-8">
        <h4 className="text-[15px] font-serif font-semibold tracking-wider">Recent Notes</h4>
        <p className="text-[#57536e] font-mono text-[12.5px]">All Recent notes</p>
    </div>

    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {recentNotes.map((note) => (
      <RecentNotesCard
        key={note.title}
        title={note.title}
        description={note.description}
        folder={note.folder}
        updatedAt={note.updatedAt}
        icon={iconMap[note.icon]}
        color={note.color}
      />
    ))}
  </div>





    
    

    
    
      
  </div>
  </div>
}

export default Main;