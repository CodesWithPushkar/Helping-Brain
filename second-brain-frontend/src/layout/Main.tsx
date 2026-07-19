import MainNav from "../components/MainNav"
import SearchComponent from "../components/SearchComponent";
import { Sparkle } from "lucide-react";
import ButtonComponent from "../components/ButtonComponent";
import FolderComponent from "../components/FolderCompenent";
import AddButton from "../components/AddButton";
import { useDashboard } from "../hooks/ContextApi/DashboardContex";

import { ICONS, type FolderIconName } from "../components/Form";

type MainProps = {
  username: string;
  totalFolderCount: number;
}

const Main = ({username, totalFolderCount}: MainProps) => {

  const { pages, setOpen } = useDashboard();
  return <div className="bg-paper-dim h-full w-full">
  <div className="flex flex-1 px-9 pt-7 pb-15 flex-col max-w-[1160px]">

      {/* {selectedPage ? (
        <h1 className="text-2xl font-bold text-zinc-900">{selectedPage.title}</h1>
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
        <h4 className="text-[15px] font-serif font-semibold tracking-wider mb-4">Notes</h4>
        <p className="text-[#57536e] font-mono text-[12.5px]">{totalFolderCount} total</p>
    </div>

    <div className="flex gap-4 w-full flex-wrap" >
      {
        pages.slice(0,3).map((p) => (
          <FolderComponent
            key={p.id}
            name={p.title}
            icon={ICONS[p.icon as FolderIconName]}
            childCount={p._count.children}
            color={p.color}
            className={"flex-1"}
          />
        ))
      }

      <AddButton title="+ Add Notes" className="w-[256px] bg-white border-none text-black hover:text-black" onClick={() => setOpen(true)}/>
    </div>

    <div className="flex justify-between mt-8">
        <h4 className="text-[15px] font-serif font-semibold tracking-wider">Recent Notes</h4>
        <p className="text-[#57536e] font-mono text-[12.5px]">All Recent notes</p>
    </div>

    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {/*
      A "recent note" is now just a page whose content isn't null.
      Once your API sends page.content, filter + map here, e.g.:

      {pages
        .filter((p) => p.content !== null)
        .map((p) => (
          <RecentNotesCard
            key={p.id}
            title={p.title}
            description={...}
            folder={...}
            updatedAt={p.updated_at}
            icon={ICONS[p.icon as FolderIconName]}
            color={p.color}
          />
        ))}
    */}
  </div>

  </div>
  </div>
}

export default Main;