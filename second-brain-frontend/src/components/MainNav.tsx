import { Bell, Sparkle } from "lucide-react";

type NavProps = {
  workspaceName: string;
}

const Nav = ({workspaceName}:NavProps) => {
  return <div className="mb-5 flex min-w-0 items-center justify-between gap-2 sm:mb-7 sm:h-9 sm:gap-4">
    <div className="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-[13px] sm:gap-2 sm:text-[15px]">
      <span className="min-w-0 truncate font-semibold">{workspaceName}</span>
      <span className="hidden shrink-0 text-[#57536e] sm:inline">/ All notes</span>
    </div>
    <div className="flex shrink-0 items-center gap-2 sm:gap-4">
      <button
        type="button"
        aria-label="Notifications"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-black hover:bg-white sm:h-auto sm:w-auto sm:p-3"
      >
        <Bell size={18} />
      </button>
      <button
        type="button"
        aria-label="Ask AI"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo text-white hover:bg-indigo-deep sm:h-auto sm:w-auto sm:gap-2.5 sm:px-4 sm:py-3"
      >
        <Sparkle size={18} color="yellow" />
        <span className="hidden sm:inline">Ask AI</span>
      </button>
    </div>
  </div>
}

export default Nav;