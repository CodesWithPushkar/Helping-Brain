type ProfileCardProps = {
  name: string;
  email: string;
  avatar?: string;
  onClick?: () => void; 
};

const ProfileCard = ({ name, email, avatar, onClick }: ProfileCardProps) => {
  return (
    <div className="border-t border-[#34314f] pt-4">
      <div className="flex items-center justify-between rounded-xl px-2 py-2 transition-colors hover:bg-[#262340] cursor-pointer">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7F9966] text-sm font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex flex-col">
            <span className="text-[15px] font-semibold text-white">
              {name}
            </span>
            <span className="text-[13px] text-[#A39DBD]">
              {email}
            </span>
          </div>
        </div>

        <button className="rounded-md p-1 text-[#6B6691] transition-colors hover:bg-[#302d49] hover:text-white" onClick={onClick}>
          ⊘
        </button>
      </div>
    </div>
  );
};

export default ProfileCard;