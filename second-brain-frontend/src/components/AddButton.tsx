import { cn } from "../utils";

type NewContentButtonProps = {
  title: string,
  style?: string;
  className?: string;
  onClick?: () => void;
}

const AddButton = ({title, className="", onClick}: NewContentButtonProps) => {
  return <>
    <div className={cn(`flex items-center justify-center bg-transparent border-2 border-dotted rounded-sm p-2 text-[#A29FC4] hover:text-[#FFD700] transition-colors `, className)}>
        <button className="w-full outline-none" onClick={onClick}>
          {title}
        </button>
    </div>
  </>
}

export default AddButton;