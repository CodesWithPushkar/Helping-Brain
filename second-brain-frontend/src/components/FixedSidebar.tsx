

const FixedSidebar = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* 1. The Fixed Sidebar */}
      <aside className="fixed top-0 left-0 w-64 h-screen bg-slate-800 text-white border-r border-slate-700">
        <div className="p-4 text-xl font-bold border-b border-slate-700">
          My App
        </div>
        <nav className="p-4 flex flex-col space-y-2">
          <a href="#" className="p-2 hover:bg-slate-700 rounded">Home</a>
          <a href="#" className="p-2 hover:bg-slate-700 rounded">Dashboard</a>
          <a href="#" className="p-2 hover:bg-slate-700 rounded">Settings</a>
        </nav>
      </aside>

    </div>
  );
};

export default FixedSidebar;