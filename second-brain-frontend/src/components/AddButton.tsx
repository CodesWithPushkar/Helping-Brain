import { cn } from "../utils";

type NewContentButtonProps = {
  title: string,
  className?: string;
  onClick?: () => void;
}

const AddButton = ({title, className="", onClick}: NewContentButtonProps) => {
  return <>
    <div className={cn(`flex items-center justify-center bg-transparent border-2 border-dotted rounded-[15px] p-2 text-[#A29FC4] hover:text-[#FFD700] transition-colors transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md`, className)}>
        <button className="w-full outline-none" onClick={onClick}>
          {title}
        </button>
    </div>
  </>
}

export default AddButton;