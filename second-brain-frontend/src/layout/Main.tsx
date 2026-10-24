import MainNav from "../components/MainNav"
import SearchComponent from "../components/SearchComponent";
import { Sparkle } from "lucide-react";
import ButtonComponent from "../components/ButtonComponent";
import FolderComponent from "../components/FolderCompenent";
import AddButton from "../components/AddButton";
import { useDashboard } from "../hooks/ContextApi/DashboardContex";
import RecentNotesCard from "../components/RecentNotes";
import { ICONS, type FolderIconName } from "../components/Form";
import { Menu } from "lucide-react";

type MainProps = {
  username: string;
  totalFolderCount: number;
  onOpenSidebar: () => void;
}

const Main = ({username, totalFolderCount, onOpenSidebar}: MainProps) => {

  const { pages, setOpen, selectedWorkspace } = useDashboard();
  const recentPages = [...pages]
  .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  .slice(0, 6);

  return <main className="min-w-0 flex-1 overflow-y-auto bg-paper-dim">
    <div className="mx-auto flex min-h-full w-full max-w-[1160px] flex-col px-4 pb-24 pt-5 sm:px-7 sm:pt-7 lg:px-9">

      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={onOpenSidebar}
          className="mt-0.5 rounded-lg border border-black/10 bg-white p-2 text-[#1B1E2A] shadow-sm md:hidden"
        >
          <Menu size={19} />
        </button>
        <div className="min-w-0 flex-1">
          <MainNav workspaceName={selectedWorkspace?.title ?? ""}/>
        </div>
      </div>

      
      <span className="mb-1 font-mono text-sm text-[#57536e]">Good afternoon, {username}</span>
      <h1 className="mb-2 font-serif text-[26px] leading-tight sm:text-[32px]">Your second brain, organised.</h1>
      <div className="text-[14.5px] leading-relaxed text-[#57536e]">
        <p>Pick up a note, browse a folder, or ask across everything you've written —</p>
        <p>Helping Brain remembers what you don't.</p>
      </div>
      
      <SearchComponent className="my-6 p-3 sm:my-8 sm:p-4" icon={Sparkle} iconColor="black" placeholder="Ask across every note in this workspace ..." rightElement={<ButtonComponent title="Ask" className="bg-black"/>} />

      <div className="flex justify-between">
          <h4 className="text-[15px] font-serif font-semibold tracking-wider mb-4">Notes</h4>
          <p className="text-[#57536e] font-mono text-[12.5px]">{totalFolderCount} total</p>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
        {
          pages.slice(0,3).map((p) => (
            <FolderComponent
              key={p.id}
              id={p.id}
              name={p.title}
              icon={ICONS[p.icon as FolderIconName]}
              childCount={p._count.children}
              color={p.color}
              className={"h-full w-full"}
            />
          ))
        }

        <AddButton title="+ Add Notes" className="min-h-[72px] w-full bg-white border-none text-black hover:text-black" onClick={() => setOpen(true)}/>
      </div>

      <div className="flex justify-between mt-8">
          <h4 className="text-[15px] font-serif font-semibold tracking-wider">Recent Notes</h4>
          <p className="text-[#57536e] font-mono text-[12.5px]">All Recent notes</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
      
      
        

        {recentPages.map((p) => (
            <RecentNotesCard
              key={p.id}
              id = {p.id}
              title={p.title}
              description={"Your recent notes is here"}
              updatedAt={p.updated_at}
              icon={ICONS[p.icon as FolderIconName]}
              color={p.color}
            />
          ))}
    
    </div>

    </div>
  </main>
}

export default Main;