

const DashboardSkeleton = () => {
  const shimmerClass = "animate-pulse bg-[#e4dfd1] rounded-xl";

  return (
    <div className="flex-grow bg-[#f4f0e6] py-10 px-6 md:px-14 min-h-screen flex flex-col gap-10 font-sans">
      
      {/* Top Header: Title and Buttons */}
      <div className="flex justify-between items-center">
        <div className={`${shimmerClass} h-6 w-48 sm:w-64`}></div>
        <div className="flex gap-4">
          <div className={`${shimmerClass} h-10 w-10`}></div>
          <div className={`${shimmerClass} h-10 w-24`}></div>
        </div>
      </div>

      {/* Hero Section: Greeting, Big Title, Subtitle */}
      <div className="flex flex-col gap-4">
        <div className={`${shimmerClass} h-4 w-32`}></div>
        <div className={`${shimmerClass} h-12 w-full max-w-[450px]`}></div>
        <div className={`${shimmerClass} h-4 w-full max-w-[600px]`}></div>
        <div className={`${shimmerClass} h-4 w-[60%] max-w-[400px]`}></div>
      </div>

      <div className={`${shimmerClass} h-[70px] w-full`}></div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <div className={`${shimmerClass} h-6 w-24`}></div>
          <div className={`${shimmerClass} h-4 w-16`}></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`${shimmerClass} h-20 w-full`}></div>
          <div className={`${shimmerClass} h-20 w-full`}></div>
          <div className={`${shimmerClass} h-20 w-full`}></div>
          <div className={`${shimmerClass} h-20 w-full`}></div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <div className={`${shimmerClass} h-6 w-32`}></div>
          <div className={`${shimmerClass} h-4 w-24`}></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`${shimmerClass} h-40 w-full`}></div>
          <div className={`${shimmerClass} h-40 w-full`}></div>
          <div className={`${shimmerClass} h-40 w-full`}></div>
        </div>
      </div>

    </div>
  );
};

export default DashboardSkeleton;