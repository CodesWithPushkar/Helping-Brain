type DashboardErrorProps = {
  message: string;
  onRetry: () => void;
}

const DashboardError = ({ message, onRetry }: DashboardErrorProps) => {
  return (
    <div className="flex-grow bg-[#f4f0e6] flex flex-col items-center justify-center min-h-screen p-6 font-sans text-center">
      
      <div className="mb-6 text-red-500 bg-red-100 p-4 rounded-full">
        <svg 
          className="w-10 h-10" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h2 className="text-[#191824] text-2xl font-bold mb-2">
        Couldn't load workspace
      </h2>
      <p className="text-gray-600 max-w-md mb-8">
        {message || "We ran into a problem while retrieving your folders and notes. Please check your connection and try again."}
      </p>

      <button 
        onClick={onRetry}
        className="bg-[#191824] hover:bg-gray-800 text-[#f4f0e6] font-medium py-3 px-8 rounded-xl transition-colors duration-200"
      >
        Try Again
      </button>

    </div>
  );
};

export default DashboardError;